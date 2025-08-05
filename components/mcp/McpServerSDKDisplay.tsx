'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Skeleton,
  Alert,
  Code,
  Tabs,
  Tab,
  Spinner,
  Accordion,
  AccordionItem
} from '@heroui/react';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  FileText,
  Layers,
  Zap,
  Activity,
  Code2
} from 'lucide-react';
import { useMcpDataWithSDK } from '@/hooks/useMcpDataWithSDK';
import { McpServer } from '@/types/mcp';
import { SchemaDisplay } from './SchemaDisplay';

interface McpServerSDKDisplayProps {
  server: McpServer;
  autoFetch?: boolean;
}

export function McpServerSDKDisplay({ server, autoFetch = true }: McpServerSDKDisplayProps) {
  const {
    data,
    connectionTest,
    testConnection,
    fetchMcpData,
    clearError
  } = useMcpDataWithSDK();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('overview');

  useEffect(() => {
    if (autoFetch && server.url) {
      handleFetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server.url, autoFetch]);

  const handleTestConnection = async () => {
    clearError();
    await testConnection(server.url);
  };

  const handleFetchData = async () => {
    setIsRefreshing(true);
    clearError();
    try {
      await fetchMcpData(server.url);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await handleFetchData();
  };

  const getConnectionStatus = () => {
    if (data.connectionInfo?.connected) {
      return { color: 'success' as const, label: 'Connected', icon: CheckCircle };
    }
    if (connectionTest?.success) {
      return { color: 'success' as const, label: 'Connection Success', icon: CheckCircle };
    }
    if (data.error || connectionTest?.error) {
      return { color: 'danger' as const, label: 'Connection Failed', icon: XCircle };
    }
    return { color: 'default' as const, label: 'Unknown', icon: Activity };
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className='relative'>
              {data.sdkVersion && (
                <Chip startContent={<Code2 className="h-4 w-4" />} color="primary" variant="flat" size="sm">
                  SDK v{data.sdkVersion}
                </Chip>
              )}
            </div>
            <Chip
              color={connectionStatus.color}
              variant="flat"
              startContent={<ConnectionIcon className="h-4 w-4" />}
            >
              {connectionStatus.label}
            </Chip>
          </div>
        </CardHeader>

        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-default-600">Server Address</p>
                <Code className="text-xs">{server.url}</Code>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleTestConnection}
                  isDisabled={data.isLoading || isRefreshing}
                >
                  Test Connection
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleRefresh}
                  isLoading={isRefreshing}
                  startContent={!isRefreshing && <RefreshCw className="h-4 w-4" />}
                >
                  Refresh Data
                </Button>
              </div>
            </div>

            {(data.connectionInfo?.transport || connectionTest?.transport) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">Transport Protocol:</span>
                <Chip size="sm" color="secondary" variant="flat">
                  {data.connectionInfo?.transport || connectionTest?.transport}
                </Chip>
              </div>
            )}

            {(data.error || connectionTest?.error) && (
              <Alert
                color="danger"
                variant="flat"
                title="Connection Error"
                description={data.error || connectionTest?.error}
                onClose={clearError}
              />
            )}

            {data.lastFetched && (
              <p className="text-xs text-default-400">
                Last Updated: {data.lastFetched.toLocaleString()}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            className="w-full"
          >
            <Tab key="overview" title={
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </div>
            }>
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-none bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <CardBody className="text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-blue-600">
                        {data.isLoading ? <Spinner size="sm" /> : data.tools.length}
                      </p>
                      <p className="text-sm text-default-600">Tools</p>
                    </CardBody>
                  </Card>

                  <Card className="border-none bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                    <CardBody className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-green-600">
                        {data.isLoading ? <Spinner size="sm" /> : data.prompts.length}
                      </p>
                      <p className="text-sm text-default-600">Prompts</p>
                    </CardBody>
                  </Card>

                  <Card className="border-none bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                    <CardBody className="text-center">
                      <Layers className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-purple-600">
                        {data.isLoading ? <Spinner size="sm" /> : data.resources.length}
                      </p>
                      <p className="text-sm text-default-600">Resources</p>
                    </CardBody>
                  </Card>
                </div>

                {data.capabilities && (
                  <div>
                    <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Server Capabilities
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {data.capabilities.tools && (
                        <Chip color="primary" variant="flat" size="sm">
                          Tools Support
                        </Chip>
                      )}
                      {data.capabilities.prompts && (
                        <Chip color="success" variant="flat" size="sm">
                          Prompts Support
                        </Chip>
                      )}
                      {data.capabilities.resources && (
                        <Chip color="secondary" variant="flat" size="sm">
                          Resources Support
                        </Chip>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="tools" title={
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Tools ({data.tools.length})
              </div>
            }>
              <div className="pt-4 space-y-3">
                {data.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardBody>
                        <Skeleton className="w-3/4 h-4 mb-2" />
                        <Skeleton className="w-full h-3" />
                      </CardBody>
                    </Card>
                  ))
                ) : data.tools.length === 0 ? (
                  <div className="text-center py-8 text-default-400">
                    No tools available
                  </div>
                ) : (
                  data.tools.map((tool, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardBody>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold">{tool.title || tool.name}</h5>
                            <p className="text-sm text-default-600 mt-1">{tool.description}</p>
                            {tool.inputSchema && (
                              <div className="mt-3">
                                <Accordion
                                  variant="light"
                                  selectionMode="single"
                                  isCompact
                                >
                                  <AccordionItem
                                    key="schema"
                                    aria-label="Input Parameters"
                                    title={
                                      <div className="flex items-center gap-2">
                                        <Code2 className="h-4 w-4" />
                                        <span className="text-sm">Input Parameters</span>
                                      </div>
                                    }
                                  >
                                    <SchemaDisplay schema={tool.inputSchema} />
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            </Tab>

            <Tab key="prompts" title={
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prompts ({data.prompts.length})
              </div>
            }>
              <div className="pt-4 space-y-3">
                {data.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardBody>
                        <Skeleton className="w-3/4 h-4 mb-2" />
                        <Skeleton className="w-full h-3" />
                      </CardBody>
                    </Card>
                  ))
                ) : data.prompts.length === 0 ? (
                  <div className="text-center py-8 text-default-400">
                    No prompts available
                  </div>
                ) : (
                  data.prompts.map((prompt, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardBody>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold">{prompt.title || prompt.name}</h5>
                            {prompt.description && (
                              <p className="text-sm text-default-600 mt-1">{prompt.description}</p>
                            )}
                            {prompt.arguments && prompt.arguments.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-default-500 mb-1">Parameters:</p>
                                <div className="flex flex-wrap gap-1">
                                  {prompt.arguments.map((arg, argIndex) => (
                                    <Chip
                                      key={argIndex}
                                      size="sm"
                                      color={arg.required ? "warning" : "default"}
                                      variant="flat"
                                    >
                                      {arg.name}
                                    </Chip>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <Chip size="sm" color="success" variant="flat">
                            Prompt
                          </Chip>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            </Tab>

            <Tab key="resources" title={
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Resources ({data.resources.length})
              </div>
            }>
              <div className="pt-4 space-y-3">
                {data.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardBody>
                        <Skeleton className="w-3/4 h-4 mb-2" />
                        <Skeleton className="w-full h-3" />
                      </CardBody>
                    </Card>
                  ))
                ) : data.resources.length === 0 ? (
                  <div className="text-center py-8 text-default-400">
                    No resources available
                  </div>
                ) : (
                  data.resources.map((resource, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardBody>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold">{resource.title || resource.name}</h5>
                            <Code className="text-xs mt-1">{resource.uri}</Code>
                            {resource.description && (
                              <p className="text-sm text-default-600 mt-2">{resource.description}</p>
                            )}
                            {resource.mimeType && (
                              <Chip size="sm" color="default" variant="flat" className="mt-2">
                                {resource.mimeType}
                              </Chip>
                            )}
                          </div>
                          <Chip size="sm" color="secondary" variant="flat">
                            Resource
                          </Chip>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
