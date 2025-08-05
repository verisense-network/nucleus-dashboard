/**
 * MCP Actions with Official TypeScript SDK
 * Refactored MCP functionality using official SDK
 */

'use server';

import { createMcpClient, DEFAULT_MCP_CONFIG } from '@/lib/mcp-client';
import { McpTool, McpPrompt, McpResource, McpServerCapabilities } from '@/types/mcp';

/**
 * Test MCP connection using official SDK
 */
export async function testMcpConnectionWithSDK(mcpUrl: string): Promise<{
  success: boolean;
  transport?: string;
  capabilities?: McpServerCapabilities;
  error?: string;
  sdkVersion?: string;
}> {
  try {
    const client = createMcpClient(DEFAULT_MCP_CONFIG);
    const result = await client.testConnection(mcpUrl);

    return {
      ...result,
      sdkVersion: DEFAULT_MCP_CONFIG.version
    };
  } catch (error) {
    console.error('SDK Test Connection Error:', error);

    return {
      success: false,
      error: `SDK connection failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get MCP tools using official SDK
 */
export async function getMcpToolsWithSDK(mcpUrl: string): Promise<{
  tools: McpTool[];
  error?: string;
  transport?: string;
}> {
  const client = createMcpClient(DEFAULT_MCP_CONFIG);

  try {
    const connectionInfo = await client.connect(mcpUrl);
    const tools = await client.listTools();

    await client.disconnect();

    return {
      tools,
      transport: connectionInfo.transport
    };
  } catch (error) {
    console.error('SDK Get Tools Error:', error);

    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    return {
      tools: [],
      error: `Failed to get tools: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get MCP prompts using official SDK
 */
export async function getMcpPromptsWithSDK(mcpUrl: string): Promise<{
  prompts: McpPrompt[];
  error?: string;
  transport?: string;
}> {
  const client = createMcpClient(DEFAULT_MCP_CONFIG);

  try {
    const connectionInfo = await client.connect(mcpUrl);
    const prompts = await client.listPrompts();

    await client.disconnect();

    return {
      prompts,
      transport: connectionInfo.transport
    };
  } catch (error) {
    console.error('SDK Get Prompts Error:', error);

    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    return {
      prompts: [],
      error: `Failed to get prompts: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get MCP resources using official SDK
 */
export async function getMcpResourcesWithSDK(mcpUrl: string): Promise<{
  resources: McpResource[];
  error?: string;
  transport?: string;
}> {
  const client = createMcpClient(DEFAULT_MCP_CONFIG);

  try {
    const connectionInfo = await client.connect(mcpUrl);
    const resources = await client.listResources();

    await client.disconnect();

    return {
      resources,
      transport: connectionInfo.transport
    };
  } catch (error) {
    console.error('SDK Get Resources Error:', error);

    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    return {
      resources: [],
      error: `Failed to get resources: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Call MCP tool using official SDK
 */
export async function callMcpToolWithSDK(
  mcpUrl: string,
  toolName: string,
  arguments_: Record<string, unknown>
): Promise<{
  result?: unknown;
  error?: string;
  transport?: string;
}> {
  const client = createMcpClient(DEFAULT_MCP_CONFIG);

  try {
    const connectionInfo = await client.connect(mcpUrl);
    const result = await client.callTool(toolName, arguments_);

    await client.disconnect();

    return {
      result,
      transport: connectionInfo.transport
    };
  } catch (error) {
    console.error('SDK Call Tool Error:', error);

    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    return {
      error: `Failed to call tool: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get MCP prompt content using official SDK
 */
export async function getMcpPromptWithSDK(
  mcpUrl: string,
  promptName: string,
  arguments_?: Record<string, unknown>
): Promise<{
  result?: unknown;
  error?: string;
  transport?: string;
}> {
  const client = createMcpClient(DEFAULT_MCP_CONFIG);

  try {
    const connectionInfo = await client.connect(mcpUrl);
    const result = await client.getPrompt(promptName, arguments_);

    await client.disconnect();

    return {
      result,
      transport: connectionInfo.transport
    };
  } catch (error) {
    console.error('SDK Get Prompt Error:', error);

    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    return {
      error: `Failed to get prompt content: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Read MCP resource content using official SDK
 */
export async function readMcpResourceWithSDK(
  mcpUrl: string,
  resourceUri: string
): Promise<{
  result?: unknown;
  error?: string;
  transport?: string;
}> {
  const client = createMcpClient(DEFAULT_MCP_CONFIG);

  try {
    const connectionInfo = await client.connect(mcpUrl);
    const result = await client.readResource(resourceUri);

    await client.disconnect();

    return {
      result,
      transport: connectionInfo.transport
    };
  } catch (error) {
    console.error('SDK Read Resource Error:', error);

    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    return {
      error: `Failed to read resource: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get complete MCP server information (using official SDK)
 */
export async function getMcpServerInfoWithSDK(mcpUrl: string): Promise<{
  connectionInfo?: {
    connected: boolean;
    transport: string;
    serverUrl: string;
  };
  capabilities?: McpServerCapabilities;
  tools?: McpTool[];
  prompts?: McpPrompt[];
  resources?: McpResource[];
  error?: string;
  sdkVersion?: string;
}> {
  const client = createMcpClient(DEFAULT_MCP_CONFIG);

  try {
    // Connect to server
    const connectionInfo = await client.connect(mcpUrl);

    // Get all data in parallel
    const [capabilities, tools, prompts, resources] = await Promise.all([
      client.getServerCapabilities(),
      client.listTools(),
      client.listPrompts(),
      client.listResources()
    ]);

    await client.disconnect();

    return {
      connectionInfo: {
        connected: connectionInfo.connected,
        transport: connectionInfo.transport,
        serverUrl: connectionInfo.serverUrl
      },
      capabilities,
      tools,
      prompts,
      resources,
      sdkVersion: DEFAULT_MCP_CONFIG.version
    };
  } catch (error) {
    console.error('SDK Get Server Info Error:', error);

    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    return {
      error: `Failed to get server info: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Backward compatibility: keep original function names but use SDK
export async function testMcpConnection(mcpUrl: string) {
  return testMcpConnectionWithSDK(mcpUrl);
}

export async function getMcpTools(mcpUrl: string) {
  return getMcpToolsWithSDK(mcpUrl);
}

export async function getMcpPrompts(mcpUrl: string) {
  return getMcpPromptsWithSDK(mcpUrl);
}

export async function getMcpResources(mcpUrl: string) {
  return getMcpResourcesWithSDK(mcpUrl);
}
