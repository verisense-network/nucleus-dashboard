/**
 * MCP Data Hook with Official SDK
 * React Hook using official SDK
 */

'use client';

import { useState, useCallback } from 'react';
import { McpTool, McpPrompt, McpResource, McpServerCapabilities } from '@/types/mcp';
import {
  testMcpConnectionWithSDK,
  getMcpToolsWithSDK,
  getMcpPromptsWithSDK,
  getMcpResourcesWithSDK,
  getMcpServerInfoWithSDK,
  callMcpToolWithSDK,
  getMcpPromptWithSDK,
  readMcpResourceWithSDK
} from '@/lib/mcp-actions-sdk';

export interface McpDataWithSDK {
  tools: McpTool[];
  prompts: McpPrompt[];
  resources: McpResource[];
  capabilities?: McpServerCapabilities;
  connectionInfo?: {
    connected: boolean;
    transport: string;
    serverUrl: string;
  };
  lastFetched?: Date;
  error?: string;
  isLoading: boolean;
  sdkVersion?: string;
}

export interface McpConnectionTestResult {
  success: boolean;
  transport?: string;
  capabilities?: McpServerCapabilities;
  error?: string;
  sdkVersion?: string;
}

export function useMcpDataWithSDK() {
  const [data, setData] = useState<McpDataWithSDK>({
    tools: [],
    prompts: [],
    resources: [],
    isLoading: false
  });

  const [connectionTest, setConnectionTest] = useState<McpConnectionTestResult | null>(null);

  /**
   * Test MCP connection
   */
  const testConnection = useCallback(async (mcpUrl: string): Promise<McpConnectionTestResult> => {
    try {
      setConnectionTest({ success: false, error: 'Testing connection...' });

      const result = await testMcpConnectionWithSDK(mcpUrl);
      setConnectionTest(result);

      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`
      };
      setConnectionTest(errorResult);
      return errorResult;
    }
  }, []);

  /**
   * Get MCP data (tools, prompts, resources)
   */
  const fetchMcpData = useCallback(async (mcpUrl: string): Promise<McpDataWithSDK> => {
    setData(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // Use new SDK method to get complete server information
      const serverInfo = await getMcpServerInfoWithSDK(mcpUrl);

      if (serverInfo.error) {
        const errorData: McpDataWithSDK = {
          tools: [],
          prompts: [],
          resources: [],
          isLoading: false,
          error: serverInfo.error,
          lastFetched: new Date()
        };
        setData(errorData);
        return errorData;
      }

      const newData: McpDataWithSDK = {
        tools: serverInfo.tools || [],
        prompts: serverInfo.prompts || [],
        resources: serverInfo.resources || [],
        capabilities: serverInfo.capabilities,
        connectionInfo: serverInfo.connectionInfo,
        isLoading: false,
        lastFetched: new Date(),
        sdkVersion: serverInfo.sdkVersion
      };

      setData(newData);
      return newData;
    } catch (error) {
      console.error('fetchMcpData error:', error);

      const errorData: McpDataWithSDK = {
        tools: [],
        prompts: [],
        resources: [],
        isLoading: false,
        error: `Failed to fetch data: ${error instanceof Error ? error.message : String(error)}`,
        lastFetched: new Date()
      };

      setData(errorData);
      return errorData;
    }
  }, []);

  /**
   * Get only tools list
   */
  const fetchTools = useCallback(async (mcpUrl: string): Promise<McpTool[]> => {
    try {
      const result = await getMcpToolsWithSDK(mcpUrl);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.tools;
    } catch (error) {
      console.error('fetchTools error:', error);
      throw error;
    }
  }, []);

  /**
   * Get only prompts list
   */
  const fetchPrompts = useCallback(async (mcpUrl: string): Promise<McpPrompt[]> => {
    try {
      const result = await getMcpPromptsWithSDK(mcpUrl);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.prompts;
    } catch (error) {
      console.error('fetchPrompts error:', error);
      throw error;
    }
  }, []);

  /**
   * Get only resources list
   */
  const fetchResources = useCallback(async (mcpUrl: string): Promise<McpResource[]> => {
    try {
      const result = await getMcpResourcesWithSDK(mcpUrl);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.resources;
    } catch (error) {
      console.error('fetchResources error:', error);
      throw error;
    }
  }, []);

  /**
   * Call MCP tool
   */
  const callTool = useCallback(async (
    mcpUrl: string,
    toolName: string,
    arguments_: Record<string, unknown>
  ): Promise<unknown> => {
    try {
      const result = await callMcpToolWithSDK(mcpUrl, toolName, arguments_);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.result;
    } catch (error) {
      console.error('callTool error:', error);
      throw error;
    }
  }, []);

  /**
   * Get prompt content
   */
  const getPrompt = useCallback(async (
    mcpUrl: string,
    promptName: string,
    arguments_?: Record<string, unknown>
  ): Promise<unknown> => {
    try {
      const result = await getMcpPromptWithSDK(mcpUrl, promptName, arguments_);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.result;
    } catch (error) {
      console.error('getPrompt error:', error);
      throw error;
    }
  }, []);

  /**
   * Read resource content
   */
  const readResource = useCallback(async (
    mcpUrl: string,
    resourceUri: string
  ): Promise<unknown> => {
    try {
      const result = await readMcpResourceWithSDK(mcpUrl, resourceUri);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.result;
    } catch (error) {
      console.error('readResource error:', error);
      throw error;
    }
  }, []);

  /**
   * Clear data
   */
  const clearData = useCallback(() => {
    setData({
      tools: [],
      prompts: [],
      resources: [],
      isLoading: false
    });
    setConnectionTest(null);
  }, []);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    setData(prev => ({ ...prev, error: undefined }));
    setConnectionTest(prev => prev ? { ...prev, error: undefined } : null);
  }, []);

  return {
    data,
    connectionTest,
    testConnection,
    fetchMcpData,
    fetchTools,
    fetchPrompts,
    fetchResources,
    callTool,
    getPrompt,
    readResource,
    clearData,
    clearError
  };
}
