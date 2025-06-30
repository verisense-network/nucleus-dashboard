import { ApiPromise, WsProvider, HttpProvider } from "@polkadot/api";

const connectionCache = new Map<string, ApiPromise>();
const connectionState = new Map<string, { 
  isConnecting: boolean; 
  lastError?: Error; 
  lastConnectTime?: number;
  reconnectAttempts: number;
}>();
const pendingConnections = new Map<string, Promise<ApiPromise>>();

const CONFIG = {
  WS_TIMEOUT: 10000,
  API_TIMEOUT: 25000,
  HEALTH_CHECK_TIMEOUT: 5000,
  MAX_RECONNECT_ATTEMPTS: 8,
  BASE_RETRY_DELAY: 2000,
  MAX_RETRY_DELAY: 60000,
  CONNECTION_COOLDOWN: 3000,
} as const;

function isFatalError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes('unauthorized') || 
         message.includes('forbidden') || 
         message.includes('invalid endpoint') ||
         message.includes('malformed url');
}

function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes('disconnected') ||
         message.includes('connection') ||
         message.includes('timeout') ||
         message.includes('1006') ||
         message.includes('1005') ||
         message.includes('abnormal closure') ||
         message.includes('no status received') ||
         message.includes('network');
}

export async function getPolkadotApi(endpoint: string, maxRetries: number = 3, retryDelay: number = CONFIG.BASE_RETRY_DELAY) {
  const url = endpoint;

  if (connectionCache.has(url)) {
    const cachedApi = connectionCache.get(url)!;
    try {
      await Promise.race([
        cachedApi.rpc.system.chain(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), CONFIG.HEALTH_CHECK_TIMEOUT)
        )
      ]);
      console.log(`use cached Polkadot API connection: ${url}`);
      return cachedApi;
    } catch (error) {
      console.warn(`cached connection is invalid, will reconnect: ${url}`, error);
      connectionCache.delete(url);
      try {
        await cachedApi.disconnect();
      } catch (disconnectError) {
        console.warn(`error when disconnect invalid connection:`, disconnectError);
      }
    }
  }
  
  if (pendingConnections.has(url)) {
    console.log(`waiting for existing connection request: ${url}`);
    try {
      return await pendingConnections.get(url)!;
    } catch (error) {
      console.warn(`waited connection failed, creating new one: ${url}`, error);
    }
  }

  const state = connectionState.get(url);
  if (state?.lastConnectTime && Date.now() - state.lastConnectTime < CONFIG.CONNECTION_COOLDOWN) {
    throw new Error(`connection too frequent, please try again later: ${url}`);
  }

  const connectionPromise = createConnection(url, maxRetries, retryDelay, state);
  pendingConnections.set(url, connectionPromise);
  
  try {
    return await connectionPromise;
  } finally {
    pendingConnections.delete(url);
  }
}

async function createConnection(url: string, maxRetries: number, retryDelay: number, state: any): Promise<ApiPromise> {
  connectionState.set(url, { 
    isConnecting: true, 
    reconnectAttempts: state?.reconnectAttempts || 0 
  });
  
  let lastError: Error | null = null;
  
  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`try to connect to Polkadot API (${attempt}/${maxRetries}): ${url}`);
        
        const provider = url.startsWith("http") 
          ? new HttpProvider(url)
          : new WsProvider(url, CONFIG.WS_TIMEOUT);
        
        if (provider instanceof WsProvider) {
          provider.on('error', (error) => {
            console.warn(`WebSocket connection error (attempt ${attempt}):`, error);
          });
          
          provider.on('disconnected', () => {
            console.warn(`Disconnected WebSocket connection (attempt ${attempt})`);
            connectionCache.delete(url);
            const currentState = connectionState.get(url);
            if (currentState) {
              connectionState.set(url, {
                ...currentState,
                isConnecting: false,
                reconnectAttempts: (currentState.reconnectAttempts || 0) + 1
              });
            }
          });
        }
        
        const api = await Promise.race([
          ApiPromise.create({ provider }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('API timeout')), CONFIG.API_TIMEOUT)
          )
        ]);
        
        await Promise.race([
          api.rpc.system.chain(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('API health check timeout')), CONFIG.HEALTH_CHECK_TIMEOUT)
          )
        ]);
        
        api.on('disconnected', () => {
          console.log(`API disconnected, clean cache: ${url}`);
          connectionCache.delete(url);
          const currentState = connectionState.get(url);
          if (currentState) {
            connectionState.set(url, {
              ...currentState,
              isConnecting: false,
              reconnectAttempts: (currentState.reconnectAttempts || 0) + 1
            });
          }
        });

        api.on('error', (error) => {
          console.error(`API error: ${url}`, error);
        });
        
        connectionCache.set(url, api);
        
        connectionState.set(url, {
          isConnecting: false,
          lastConnectTime: Date.now(),
          reconnectAttempts: 0
        });
        
        console.log(`Successfully connected to Polkadot API (attempt ${attempt}): ${url}`);
        return api;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Connection failed (${attempt}/${maxRetries}):`, error);
        
        if (error instanceof Error) {
          if (error.message.includes('1005') || error.message.includes('No Status Received')) {
            console.warn(`WebSocket 1005 error detected - server closed connection without status`);
            console.warn(`This usually indicates server overload or network issues`);
          } else if (error.message.includes('1006') || error.message.includes('Abnormal Closure')) {
            console.warn(`WebSocket 1006 error detected - abnormal connection closure`);
            console.warn(`This usually indicates network connectivity issues`);
          }
        }
        
        if (isFatalError(lastError)) {
          console.error(`Fatal error, stop retry: ${lastError.message}`);
          break;
        }
        
        if (attempt < maxRetries) {
          const baseDelay = isNetworkError(lastError) 
            ? retryDelay * 2 
            : retryDelay;
          
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt - 1),
            CONFIG.MAX_RETRY_DELAY
          );
          console.log(`Retry after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    const currentState = connectionState.get(url);
    const totalAttempts = (currentState?.reconnectAttempts || 0) + maxRetries;
    
    if (totalAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
      connectionState.set(url, {
        isConnecting: false,
        lastError: lastError!,
        lastConnectTime: Date.now(),
        reconnectAttempts: totalAttempts
      });
      throw new Error(`Too many connection attempts (${totalAttempts}), please try again later: ${lastError?.message}`);
    }
    
    throw new Error(`${maxRetries} attempts failed, still cannot connect to Polkadot API: ${lastError?.message}`);
    
  } finally {
    const currentState = connectionState.get(url);
    if (currentState?.isConnecting) {
      connectionState.set(url, {
        ...currentState,
        isConnecting: false
      });
    }
  }
}

export async function clearAllConnections() {
  const disconnectPromises = Array.from(connectionCache.values()).map(async (api) => {
    try {
      await api.disconnect();
    } catch (error) {
      console.warn('error when disconnect:', error);
    }
  });
  
  await Promise.allSettled(disconnectPromises);
  connectionCache.clear();
  connectionState.clear();
  pendingConnections.clear();
}

export function getCachedConnectionsCount(): number {
  return connectionCache.size;
}

export function getConnectionStates(): Map<string, any> {
  return new Map(connectionState);
}

export function resetConnectionState(endpoint: string): void {
  connectionState.delete(endpoint);
  if (connectionCache.has(endpoint)) {
    const api = connectionCache.get(endpoint)!;
    connectionCache.delete(endpoint);
    api.disconnect().catch(error => {
      console.warn('error when reset connection state:', error);
    });
  }
}