"use server";

import { getNucleusListAPI, getNucleusByIdAPI, getNucleusAbiAPI } from "@/api/nucleus";
import { getNodeDetailAPI } from "@/api/node";
import { NucleusListResponse, NucleusInfo } from "@/types/nucleus";
import { NodeDetail } from "@/types/node";
import { AgentCard } from "@/types/a2a";
import { APIResponse } from "@/types/api";
import { getAgentByIdAPI, getAgentListAPI, getMcpServerListAPI, getMcpServerByIdAPI, deregisterMcp } from "@/api/rpc";
import { McpPrompt, McpResource, McpServer, McpServerCapabilities, McpServerDetails, McpTool } from "@/types/mcp";
import { createMcpClient, DEFAULT_MCP_CONFIG } from "@/lib/mcp-client";

export async function getNucleusList(endpoint: string): Promise<NucleusListResponse> {
  try {
    const data = await getNucleusListAPI(endpoint);

    return {
      success: true,
      data,
    };
  } catch (e: any) {
    console.error("getNucleusList error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getNucleusDetail(endpoint: string, id: string): Promise<APIResponse<NucleusInfo>> {
  try {
    const data = await getNucleusByIdAPI(endpoint, id);

    return {
      success: true,
      data,
    };
  } catch (e: any) {
    console.error("getNucleusDetail error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getNodeDetail(endpoint: string): Promise<APIResponse<NodeDetail>> {
  try {
    const data = await getNodeDetailAPI(endpoint);

    return {
      success: true,
      data,
    };
  } catch (e: any) {
    console.error("getNodeDetail error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getNucleusAbi(rpcUrl: string): Promise<any> {
  try {
    const data = await getNucleusAbiAPI(rpcUrl);
    return {
      success: true,
      data,
    };
  } catch (e: any) {
    console.error("getNucleusAbi error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export type AgentInfo = {
  agentId: string;
  ownerId: string;
  agentCard: AgentCard;
}

export type AgentListResponse = APIResponse<AgentInfo[]>;

export async function getAgentList(endpoint: string): Promise<AgentListResponse> {
  try {
    const data = await getAgentListAPI(endpoint);
    return {
      success: true,
      data: data as unknown as AgentInfo[],
    };
  } catch (e: any) {
    console.error("getAgentList error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getAgentById(endpoint: string, agentId: string): Promise<APIResponse<AgentInfo>> {
  try {
    const data = await getAgentByIdAPI(endpoint, agentId);
    return {
      success: true,
      data: data as unknown as AgentInfo,
    };
  } catch (e: any) {
    console.error("getAgentList error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export type McpServerListResponse = APIResponse<McpServer[]>;

export async function getMcpServerList(endpoint: string): Promise<McpServerListResponse> {
  try {
    const data = await getMcpServerListAPI(endpoint);
    return {
      success: true,
      data: data,
    };
  } catch (e: any) {
    console.error("getMcpServerList error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getMcpServerById(endpoint: string, serverId: string): Promise<APIResponse<McpServer>> {
  try {
    const data = await getMcpServerByIdAPI(endpoint, serverId);
    console.log("MCP Server Data:", data);
    return {
      success: true,
      data: data,
    };
  } catch (e: any) {
    console.error("getMcpServerById error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}


/**
 * Get detailed MCP server capability information (using official SDK)
 */
export async function getMcpServerDetails(endpoint: string, serverId: string): Promise<APIResponse<McpServerDetails>> {
  try {
    // First get basic information
    const serverInfoResponse = await getMcpServerById(endpoint, serverId);
    if (!serverInfoResponse.success || !serverInfoResponse.data) {
      return {
        success: false,
        message: serverInfoResponse.message || "Failed to get server info",
      };
    }

    const serverInfo = serverInfoResponse.data;

    try {
      // Use official SDK to get detailed information
      const serverData = await getMcpServerInfoWithSDK(serverInfo.url);

      if (serverData.error) {
        // SDK connection failed, return basic info but include error
        const detailedServer: McpServerDetails = {
          ...serverInfo,
          capabilities: undefined,
          tools: [],
          prompts: [],
          resources: [],
          lastFetched: new Date(),
          error: serverData.error
        };

        return {
          success: true,
          data: detailedServer,
        };
      }

      // SDK connection successful, return complete information
      const detailedServer: McpServerDetails = {
        ...serverInfo,
        capabilities: serverData.capabilities,
        tools: serverData.tools || [],
        prompts: serverData.prompts || [],
        resources: serverData.resources || [],
        lastFetched: new Date(),
      };

      return {
        success: true,
        data: detailedServer,
      };
    } catch (sdkError) {
      // SDK exception occurred, return basic info but include error
      const error = sdkError instanceof Error ? sdkError : new Error("SDK connection exception");

      const detailedServer: McpServerDetails = {
        ...serverInfo,
        capabilities: undefined,
        tools: [],
        prompts: [],
        resources: [],
        lastFetched: new Date(),
        error: `SDK connection failed: ${error.message}`
      };

      return {
        success: true,
        data: detailedServer,
      };
    }
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error("Unknown error");
    console.error("getMcpServerDetails error", error);
    return {
      success: false,
      message: error.message,
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
      error: `Failed to get server information: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}