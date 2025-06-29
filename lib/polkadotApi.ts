import { ApiPromise, WsProvider, HttpProvider } from "@polkadot/api";

const connectionCache = new Map<string, ApiPromise>();

export async function getPolkadotApi(endpoint: string, maxRetries: number = 3, retryDelay: number = 2000) {
  const url = endpoint;

  if (connectionCache.has(url)) {
    const cachedApi = connectionCache.get(url)!;
    try {
      await cachedApi.rpc.system.chain();
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
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`attempt to connect to Polkadot API (${attempt}/${maxRetries}): ${url}`);
      
      const provider = url.startsWith("http") 
        ? new HttpProvider(url)
        : new WsProvider(url, 1000);
      
      if (provider instanceof WsProvider) {
        provider.on('error', (error) => {
          console.warn(`WebSocket connection error (${attempt}th attempt):`, error);
        });
        
        provider.on('disconnected', () => {
          console.warn(`WebSocket connection disconnected (${attempt}th attempt)`);
          connectionCache.delete(url);
        });
      }
      
      const api = await Promise.race([
        ApiPromise.create({ provider }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      
      await api.rpc.system.chain();
      
      api.on('disconnected', () => {
        console.log(`API disconnected, clean cache: ${url}`);
        connectionCache.delete(url);
      });
      
      connectionCache.set(url, api);
      
      console.log(`successfully connected to Polkadot API (${attempt}th attempt): ${url}`);
      return api;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`connection failed (${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(1.5, attempt - 1);
        console.log(`${delay}ms later retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`failed to connect to Polkadot API after ${maxRetries} attempts: ${lastError?.message}`);
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
}

export function getCachedConnectionsCount(): number {
  return connectionCache.size;
}