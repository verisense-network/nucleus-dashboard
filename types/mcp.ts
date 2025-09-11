export interface McpServer {
  id?: string;
  name: string;
  description: string;
  url: string;
  provider: string;
  priceRate?: string;
  urlVerified: boolean,
  logo?: string;
  providerWebsite?: string;
  providerName?: string;
}

// Official MCP SDK related types
export interface McpClientConfig {
  name: string;
  version: string;
}

export interface McpConnectionInfo {
  serverUrl: string;
  transport: 'http' | 'streamable-http' | 'sse';
  connected: boolean;
  sessionId?: string;
}

// MCP Tools type definitions
export interface McpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  outputSchema?: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// MCP Prompts type definitions
export interface McpPrompt {
  name: string;
  title?: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

// MCP Resources type definitions
export interface McpResource {
  uri: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
}

// MCP Server Capabilities 
export interface McpServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
}

// MCP Server detailed information with capability data
export interface McpServerDetails extends McpServer {
  capabilities?: McpServerCapabilities;
  tools?: McpTool[];
  prompts?: McpPrompt[];
  resources?: McpResource[];
  lastFetched?: Date;
  error?: string;
}