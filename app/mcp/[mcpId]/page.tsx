"use client";

import { getMcpServerById } from "@/app/actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { ArrowLeft, Server, ExternalLink, Globe, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useHydrationEndpointStore } from "@/stores/endpoint";
import { Spinner } from "@heroui/react";
import { McpServer } from "@/types/mcp";
import { wrapApiRequest } from "@/utils/api";
import { getMcpServerByIdAPI } from "@/api/rpc";

interface McpDetailPageProps {
  params: Promise<{
    mcpId: string;
  }>;
}

export default function McpDetailPage({ params }: McpDetailPageProps) {
  const { mcpId } = use(params);
  const [{ endpoint, isLocalNode }, hydrated] = useHydrationEndpointStore(state => state);
  const router = useRouter();

  const [mcpServer, setMcpServer] = useState<McpServer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    const fetchMcpServer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await wrapApiRequest(
          getMcpServerById.bind(null, endpoint, mcpId),
          getMcpServerByIdAPI.bind(null, endpoint, mcpId),
          isLocalNode(endpoint)
        );

        if (result.success && result.data) {
          setMcpServer(result.data);
        } else {
          setError(result.message || "Failed to fetch MCP server details");
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMcpServer();
  }, [endpoint, mcpId, hydrated, isLocalNode]);

  if (error) {
    return (
      <div className="w-full mx-auto py-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardBody>
            <p className="text-danger">Failed to load MCP server: {error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full mx-auto py-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardBody className="flex items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-default-500">Loading MCP server details...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!mcpServer) {
    router.push(`/mcp/${mcpId}/not-found`);
    return null;
  }

  return (
    <div className="w-full mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
            Back to Home
          </Button>
        </Link>
      </div>

      {/* MCP Server Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{mcpServer.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Chip variant="flat" color="primary" size="sm">
                  MCP Server
                </Chip>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText size={20} />
              Description
            </h3>
            <div className="bg-default-50 rounded-lg p-4">
              <p className="text-default-700">
                {mcpServer.description || "No description available"}
              </p>
            </div>
          </div>

          <Divider />

          {/* Server URL */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Globe size={20} />
              Server URL
            </h3>
            <div className="bg-default-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono bg-default-100 px-2 py-1 rounded">
                  {mcpServer.url}
                </code>
                {mcpServer.url && (
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<ExternalLink size={14} />}
                    as="a"
                    href={mcpServer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Divider />

          {/* Server ID */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Server ID</h3>
            <div className="bg-default-50 rounded-lg p-4">
              <code className="text-sm font-mono bg-default-100 px-2 py-1 rounded">
                {mcpId}
              </code>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
