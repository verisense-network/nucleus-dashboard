'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Spinner,
} from '@heroui/react';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  FileText,
  Layers,
  Zap,
} from 'lucide-react';
import { McpServerDetails } from '@/types/mcp';
import { testMcpConnectionWithSDK } from '@/lib/mcp-actions-sdk';

interface McpServerPreviewProps {
  url: string;
  onValidationChange: (isValid: boolean, error?: string) => void;
}

export function McpServerPreview({ url, onValidationChange }: McpServerPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mcpDetails, setMcpDetails] = useState<McpServerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenValidated, setHasBeenValidated] = useState(false);

  const validateMcpServer = useCallback(async (mcpUrl: string) => {
    if (!mcpUrl) return;

    setIsLoading(true);
    setError(null);
    setMcpDetails(null);

    try {
      try {
        new URL(mcpUrl);
      } catch {
        throw new Error('Invalid URL format');
      }

      const result = await testMcpConnectionWithSDK(mcpUrl);
      console.log("result", result);

      if (result.success && result.capabilities) {
        const details: McpServerDetails = {
          id: '',
          name: '',
          description: '',
          url: mcpUrl,
          provider: '',
          urlVerified: true,
          capabilities: result.capabilities,
          tools: [],
          prompts: [],
          resources: [],
          lastFetched: new Date()
        };

        setMcpDetails(details);
        setHasBeenValidated(true);
        onValidationChange(true);
      } else {
        const errorMsg = result.error || 'Unable to connect to MCP server';
        setError(errorMsg);
        setHasBeenValidated(true);
        onValidationChange(false, errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMsg);
      setHasBeenValidated(true);
      onValidationChange(false, errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [onValidationChange]);

  useEffect(() => {
    setMcpDetails(null);
    setError(null);
    setHasBeenValidated(false);
    onValidationChange(false);
  }, [url, onValidationChange]);

  const handleManualValidation = () => {
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      validateMcpServer(trimmedUrl);
    }
  };

  const handleRetry = () => {
    setHasBeenValidated(false);
    handleManualValidation();
  };

  if (!url.trim()) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <h4 className="text-lg font-semibold">MCP Server Validation</h4>
        {!hasBeenValidated && !isLoading && (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<CheckCircle className="w-4 h-4" />}
            onPress={handleManualValidation}
          >
            Verify Server
          </Button>
        )}
        {(mcpDetails || error) && (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={handleRetry}
            isLoading={isLoading}
          >
            Retry
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {!hasBeenValidated && !isLoading && (
          <Alert
            color="warning"
            variant="flat"
            title="MCP Server Not Verified"
            description="Please verify the MCP server connection before proceeding with registration."
          />
        )}

        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm">Testing connection to MCP server...</span>
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        )}

        {error && !isLoading && hasBeenValidated && (
          <Alert
            color="danger"
            variant="flat"
            title="MCP Server Connection Failed"
            description={error}
          />
        )}

        {mcpDetails && !isLoading && !error && hasBeenValidated && (
          <div className="space-y-4">
            <Alert
              color="success"
              variant="flat"
              title="MCP Server Connected Successfully"
              description={`Successfully connected to MCP server at ${url}`}
            />

            <Tabs aria-label="MCP Server Details">
              <Tab
                key="capabilities"
                title={
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Capabilities
                  </div>
                }
              >
                <Card>
                  <CardBody className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm">Tools:</span>
                        <Chip
                          size="sm"
                          color={mcpDetails.capabilities?.tools ? "success" : "default"}
                        >
                          {mcpDetails.capabilities?.tools ? "Supported" : "Not Available"}
                        </Chip>
                      </div>

                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm">Prompts:</span>
                        <Chip
                          size="sm"
                          color={mcpDetails.capabilities?.prompts ? "success" : "default"}
                        >
                          {mcpDetails.capabilities?.prompts ? "Supported" : "Not Available"}
                        </Chip>
                      </div>

                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <span className="text-sm">Resources:</span>
                        <Chip
                          size="sm"
                          color={mcpDetails.capabilities?.resources ? "success" : "default"}
                        >
                          {mcpDetails.capabilities?.resources ? "Supported" : "Not Available"}
                        </Chip>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-divider">
                      <p className="text-xs text-default-500">
                        Validated at: {mcpDetails.lastFetched?.toLocaleString()}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </Tab>

              <Tab
                key="info"
                title={
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Server Info
                  </div>
                }
              >
                <Card>
                  <CardBody className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">URL:</span>
                        <span className="text-sm text-default-600 break-all">{url}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Chip size="sm" color="success" startContent={<CheckCircle className="w-3 h-3" />}>
                          Connected
                        </Chip>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Protocol:</span>
                        <span className="text-sm text-default-600">MCP (Model Context Protocol)</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default McpServerPreview;