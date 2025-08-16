/**
 * Official MCP TypeScript SDK Client
 * Using official SDK to connect and manage MCP servers
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import {
  McpClientConfig,
  McpConnectionInfo,
  McpTool,
  McpPrompt,
  McpResource,
  McpServerCapabilities
} from '@/types/mcp';

export class McpClient {
  private client: Client | null = null;
  private connectionInfo: McpConnectionInfo | null = null;

  constructor(private config: McpClientConfig) { }

  /**
   * Connect to MCP server
   * Auto-try Streamable HTTP, fallback to SSE on failure
   */
  async connect(serverUrl: string): Promise<McpConnectionInfo> {
    let client: Client | undefined = undefined;
    const baseUrl = new URL(serverUrl);

    try {
      // First try Streamable HTTP (latest protocol)
      client = new Client({
        name: this.config.name,
        version: this.config.version
      });

      const transport = new StreamableHTTPClientTransport(baseUrl);
      await client.connect(transport);

      this.client = client;
      this.connectionInfo = {
        serverUrl,
        transport: 'streamable-http',
        connected: true,
        sessionId: undefined // Streamable HTTP doesn't need explicit session ID
      };

      console.log('MCP: Connected using Streamable HTTP transport');
      return this.connectionInfo;

    } catch {
      console.log('MCP: Streamable HTTP connection failed, trying SSE transport');

      try {
        // Fallback to SSE transport (backward compatibility)
        client = new Client({
          name: this.config.name,
          version: this.config.version
        });

        const sseTransport = new SSEClientTransport(baseUrl);
        await client.connect(sseTransport);

        this.client = client;
        this.connectionInfo = {
          serverUrl,
          transport: 'sse',
          connected: true,
          sessionId: undefined // SSE transport handles internal session
        };

        console.log('MCP: Connected using SSE transport');
        return this.connectionInfo;

      } catch (sseError) {
        console.error('MCP: Both Streamable HTTP and SSE connection failed:', sseError);

        this.connectionInfo = {
          serverUrl,
          transport: 'http',
          connected: false
        };

        throw new Error(`Failed to connect to MCP server: ${sseError}`);
      }
    }
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.connectionInfo) {
      this.connectionInfo.connected = false;
    }
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): McpConnectionInfo | null {
    return this.connectionInfo;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionInfo?.connected ?? false;
  }

  /**
   * Get server capabilities
   */
  async getServerCapabilities(): Promise<McpServerCapabilities> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    try {
      // SDK should automatically handle capabilities, we construct a basic version here
      return {
        tools: { listChanged: true },
        prompts: { listChanged: true },
        resources: { subscribe: true, listChanged: true }
      };
    } catch (error) {
      console.error('Failed to get server capabilities:', error);
      throw new Error(`Failed to get server capabilities: ${error}`);
    }
  }

  /**
   * Get list of available tools
   */
  async listTools(): Promise<McpTool[]> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.listTools();

      return response.tools.map((tool) => ({
        name: tool.name,
        title: tool.title,
        description: tool.description || '',
        inputSchema: {
          type: 'object',
          properties: (tool.inputSchema?.properties as Record<string, unknown>) || {},
          required: tool.inputSchema?.required || []
        },
        outputSchema: tool.outputSchema as any
      }));
    } catch (error) {
      console.error('Failed to list tools:', error);
      throw new Error(`Failed to list tools: ${error}`);
    }
  }

  /**
   * Call tool
   */
  async callTool(name: string, arguments_: Record<string, unknown>): Promise<unknown> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: arguments_
      });

      return response;
    } catch (error) {
      console.error(`Failed to call tool ${name}:`, error);
      throw new Error(`Failed to call tool ${name}: ${error}`);
    }
  }

  /**
   * Get list of available prompts
   */
  async listPrompts(): Promise<McpPrompt[]> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.listPrompts();

      return response.prompts.map((prompt) => ({
        name: prompt.name,
        title: prompt.title,
        description: prompt.description,
        arguments: prompt.arguments?.map((arg) => ({
          name: arg.name,
          description: arg.description || '',
          required: arg.required || false
        }))
      }));
    } catch (error) {
      console.error('Failed to list prompts:', error);
      return [];
    }
  }

  /**
   * Get prompt content
   */
  async getPrompt(name: string, arguments_?: Record<string, unknown>): Promise<unknown> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    try {
      // Convert unknown values to strings for MCP SDK compatibility
      const stringArguments: { [x: string]: string } = {};
      if (arguments_) {
        for (const [key, value] of Object.entries(arguments_)) {
          stringArguments[key] = String(value);
        }
      }

      const response = await this.client.getPrompt({
        name,
        arguments: stringArguments
      });

      return response;
    } catch (error) {
      console.error(`Failed to get prompt ${name}:`, error);
      throw new Error(`Failed to get prompt ${name}: ${error}`);
    }
  }

  /**
   * Get list of available resources
   */
  async listResources(): Promise<McpResource[]> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.listResources();

      return response.resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name || resource.uri,
        title: resource.title,
        description: resource.description,
        mimeType: resource.mimeType,
        size: undefined // Official SDK doesn't provide size yet
      }));
    } catch (error) {
      console.error('Failed to list resources:', error);
      return [];
    }
  }

  /**
   * Read resource content
   */
  async readResource(uri: string): Promise<unknown> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await this.client.readResource({ uri });
      return response;
    } catch (error) {
      console.error(`Failed to read resource ${uri}:`, error);
      throw new Error(`Failed to read resource ${uri}: ${error}`);
    }
  }

  /**
   * Test connection
   */
  async testConnection(serverUrl: string): Promise<{
    success: boolean;
    transport?: string;
    capabilities?: McpServerCapabilities;
    error?: string;
  }> {
    try {
      const connectionInfo = await this.connect(serverUrl);
      const capabilities = await this.getServerCapabilities();

      return {
        success: true,
        transport: connectionInfo.transport,
        capabilities
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

/**
 * Create MCP client instance
 */
export function createMcpClient(config: McpClientConfig): McpClient {
  return new McpClient(config);
}

/**
 * Default client configuration
 */
export const DEFAULT_MCP_CONFIG: McpClientConfig = {
  name: 'sensestudio-web',
  version: '1.0.0'
};
