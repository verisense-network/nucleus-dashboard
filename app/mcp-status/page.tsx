"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button, Chip, Input, Progress, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from "@heroui/react";
import { useHydrationEndpointStore } from "@/stores/endpoint";
import { getMcpServerList } from "@/app/actions";
import { wrapApiRequest } from "@/utils/api";
import { getMcpServerListAPI } from "@/api/rpc";
import { McpServer } from "@/types/mcp";
import { getMcpToolsWithSDK } from "@/lib/mcp-actions-sdk";
import { AlertCircle, CheckCircle, Copy, RefreshCw, RotateCw, Search, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

interface McpServerWithStatus extends McpServer {
  toolCount: number | null; // null means not yet checked, number is the count
  status: "checking" | "available" | "broken";
  error?: string;
}

export default function McpStatusPage() {
  const [{ endpoint, status: endpointStatus, isLocalNode }, hydrated] = useHydrationEndpointStore(state => state);
  const [mcpServers, setMcpServers] = useState<McpServerWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dnsVerifiedFilter, setDnsVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [retryingServers, setRetryingServers] = useState<Set<string>>(new Set());

  const checkMcpWithRetry = async (server: McpServerWithStatus, maxRetries = 3): Promise<{
    toolCount: number;
    status: "available" | "broken";
    error?: string;
  }> => {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await getMcpToolsWithSDK(server.url);

        if (!result.error) {
          return {
            toolCount: result.tools.length,
            status: result.tools.length > 0 ? "available" : "broken",
            error: result.tools.length === 0 ? "No tools available" : undefined,
          };
        }

        lastError = result.error;

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    return {
      toolCount: 0,
      status: "broken",
      error: `Failed after ${maxRetries} attempts: ${lastError}`,
    };
  };

  useEffect(() => {
    const fetchMcpServers = async () => {
      if (!hydrated || endpointStatus !== "connected") {
        return;
      }

      try {
        setIsLoading(true);
        const result = await wrapApiRequest(
          getMcpServerList.bind(null, endpoint),
          getMcpServerListAPI.bind(null, endpoint),
          isLocalNode(endpoint)
        );

        if (!result.success) {
          setError(result.message || "Unknown error");
          return;
        }

        if (result.data) {
          setMcpServers(
            result.data.map((server: McpServer) => ({
              ...server,
              toolCount: null,
              status: "checking" as const,
            }))
          );
        }
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMcpServers();
  }, [endpoint, endpointStatus, isLocalNode, hydrated]);

  // Check tool availability for all servers - one by one with retry
  useEffect(() => {
    const needsCheck = mcpServers.length > 0 && !isChecking && mcpServers.some(s => s.status === "checking");

    if (!needsCheck) return;

    const checkAllServersSequentially = async () => {
      setIsChecking(true);

      const serversToCheck = mcpServers.filter(s => s.status === "checking");

      for (const server of serversToCheck) {
        const result = await checkMcpWithRetry(server);

        setMcpServers(prevServers =>
          prevServers.map(s =>
            s.url === server.url ? {
              ...s,
              toolCount: result.toolCount,
              status: result.status,
              error: result.error,
            } : s
          )
        );
      }

      setIsChecking(false);
    };

    checkAllServersSequentially();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcpServers.length, mcpServers.filter(s => s.status === "checking").length]);

  const handleRefresh = async () => {
    setMcpServers(prevServers =>
      prevServers.map(server => ({
        ...server,
        toolCount: null,
        status: "checking" as const,
        error: undefined,
      }))
    );

    setIsChecking(true);

    const serversSnapshot = mcpServers;

    for (const server of serversSnapshot) {
      const result = await checkMcpWithRetry(server);

      setMcpServers(prevServers =>
        prevServers.map(s =>
          s.url === server.url ? {
            ...s,
            toolCount: result.toolCount,
            status: result.status,
            error: result.error,
          } : s
        )
      );
    }

    setIsChecking(false);
    toast.success("Refresh completed!");
  };

  const handleRetrySingle = async (server: McpServerWithStatus) => {
    setRetryingServers(prev => new Set(prev).add(server.url));

    setMcpServers(prevServers =>
      prevServers.map(s =>
        s.url === server.url ? {
          ...s,
          toolCount: null,
          status: "checking" as const,
          error: undefined,
        } : s
      )
    );

    const result = await checkMcpWithRetry(server);

    setMcpServers(prevServers =>
      prevServers.map(s =>
        s.url === server.url ? {
          ...s,
          toolCount: result.toolCount,
          status: result.status,
          error: result.error,
        } : s
      )
    );

    setRetryingServers(prev => {
      const newSet = new Set(prev);
      newSet.delete(server.url);
      return newSet;
    });

    if (result.status === "available") {
      toast.success(`${server.name} is now available!`);
    } else {
      toast.error(`${server.name} is still broken after retry`);
    }
  };

  const handleCopyBrokenIds = () => {
    const brokenIds = sortedServers
      .filter((server) => server.status === "broken")
      .map((server) => server.id)
      .filter(Boolean)
      .join("\n");

    if (brokenIds) {
      navigator.clipboard.writeText(brokenIds);
      toast.success("Broken MCP IDs copied to clipboard!");
    } else {
      toast.info("No broken MCPs found!");
    }
  };

  const sortedServers = useMemo(() => {
    let filtered = mcpServers;

    if (search) {
      filtered = filtered.filter(
        (server) =>
          server.name?.toLowerCase().includes(search.toLowerCase()) ||
          server.description?.toLowerCase().includes(search.toLowerCase()) ||
          server.id?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dnsVerifiedFilter !== "all") {
      filtered = filtered.filter((server) =>
        dnsVerifiedFilter === "verified" ? server.urlVerified : !server.urlVerified
      );
    }

    return filtered.sort((a, b) => {
      if (a.status === "checking" && b.status !== "checking") return -1;
      if (a.status !== "checking" && b.status === "checking") return 1;

      if (a.status === "broken" && b.status !== "broken") return -1;
      if (a.status !== "broken" && b.status === "broken") return 1;

      const aCount = a.toolCount ?? -1;
      const bCount = b.toolCount ?? -1;
      return bCount - aCount;
    });
  }, [mcpServers, search, dnsVerifiedFilter]);

  const stats = useMemo(() => {
    const total = mcpServers.length;
    const available = mcpServers.filter((s) => s.status === "available").length;
    const broken = mcpServers.filter((s) => s.status === "broken").length;
    const checking = mcpServers.filter((s) => s.status === "checking").length;
    const verified = mcpServers.filter((s) => s.urlVerified).length;

    return { total, available, broken, checking, verified };
  }, [mcpServers]);

  if (!hydrated || endpointStatus === "connecting" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardBody>
            <p className="text-danger">Failed to load MCP data: {error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">MCP Status Dashboard</h1>
              <p className="text-default-500 mt-2">Monitor the health and availability of all MCP servers</p>
            </div>
            <div className="flex gap-2">
              <Button color="primary" startContent={<RefreshCw className="w-4 h-4" />} onPress={handleRefresh} isDisabled={isChecking}>
                {isChecking ? "Checking..." : "Refresh"}
              </Button>
              <Button color="danger" variant="bordered" startContent={<Copy className="w-4 h-4" />} onPress={handleCopyBrokenIds} isDisabled={stats.broken === 0}>
                Copy Broken IDs
              </Button>
            </div>
          </div>

          {isChecking && stats.total > 0 && (
            <Progress
              size="sm"
              label={`Checking MCP servers: ${stats.available + stats.broken} / ${stats.total}`}
              value={(stats.available + stats.broken) / stats.total * 100}
              color="primary"
              showValueLabel={true}
              className="max-w-full"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-default-500">Total MCPs</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-success">Available</p>
              <p className="text-3xl font-bold text-success">{stats.available}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-danger">Broken</p>
              <p className="text-3xl font-bold text-danger">{stats.broken}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-warning">Checking</p>
              <p className="text-3xl font-bold text-warning">{stats.checking}</p>
            </CardBody>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDnsVerifiedFilter(dnsVerifiedFilter === "verified" ? "all" : "verified")}>
            <CardBody className="text-center">
              <p className="text-sm text-primary">DNS Verified</p>
              <p className="text-3xl font-bold text-primary">{stats.verified}</p>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <Input
            className="flex-1 max-w-md"
            placeholder="Search by name, description, or ID..."
            startContent={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={dnsVerifiedFilter === "all" ? "solid" : "bordered"}
              color={dnsVerifiedFilter === "all" ? "primary" : "default"}
              onPress={() => setDnsVerifiedFilter("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={dnsVerifiedFilter === "verified" ? "solid" : "bordered"}
              color={dnsVerifiedFilter === "verified" ? "success" : "default"}
              onPress={() => setDnsVerifiedFilter("verified")}
            >
              DNS Verified
            </Button>
            <Button
              size="sm"
              variant={dnsVerifiedFilter === "unverified" ? "solid" : "bordered"}
              color={dnsVerifiedFilter === "unverified" ? "warning" : "default"}
              onPress={() => setDnsVerifiedFilter("unverified")}
            >
              Not Verified
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">MCP Servers ({sortedServers.length})</h2>
          </CardHeader>
          <CardBody>
            <Table aria-label="MCP servers status table">
              <TableHeader>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>NAME</TableColumn>
                <TableColumn>TOOLS</TableColumn>
                <TableColumn>MCP ID</TableColumn>
                <TableColumn>URL</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent={isChecking ? "Checking MCP servers..." : "No MCP servers found"}>
                {sortedServers.map((server) => (
                  <TableRow key={server.id || server.url}>
                    <TableCell>
                      {server.status === "checking" ? (
                        <Chip size="sm" variant="flat" color="warning" startContent={<Spinner size="sm" />}>
                          Checking
                        </Chip>
                      ) : server.status === "available" ? (
                        <Tooltip content="MCP is working properly">
                          <Chip size="sm" variant="flat" color="success" startContent={<CheckCircle className="w-4 h-4" />}>
                            Available
                          </Chip>
                        </Tooltip>
                      ) : (
                        <Tooltip content={server.error || "Failed to fetch tools"}>
                          <Chip size="sm" variant="flat" color="danger" startContent={<XCircle className="w-4 h-4" />}>
                            Broken
                          </Chip>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{server.name}</p>
                          {server.urlVerified && (
                            <Tooltip content="DNS has been verified">
                              <Chip size="sm" variant="flat" color="success" startContent={<CheckCircle className="w-3 h-3" />}>
                                Verified
                              </Chip>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-sm text-default-500 truncate max-w-xs">{server.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {server.status === "checking" ? (
                        <Spinner size="sm" />
                      ) : (
                        <Chip size="sm" variant="flat" color={server.toolCount && server.toolCount > 0 ? "success" : "default"}>
                          {server.toolCount ?? 0} tools
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-default-100 px-2 py-1 rounded">{server.id ? `${server.id.slice(0, 8)}...${server.id.slice(-6)}` : "N/A"}</code>
                        {server.id && (
                          <Button
                            size="sm"
                            isIconOnly
                            variant="light"
                            onPress={() => {
                              navigator.clipboard.writeText(server.id!);
                              toast.success("ID copied!");
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-default-100 px-2 py-1 rounded max-w-[200px] truncate" title={server.url}>
                          {server.url}
                        </code>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="light"
                          onPress={() => {
                            navigator.clipboard.writeText(server.url);
                            toast.success("URL copied!");
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/mcp/${server.id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="flat">
                            View Details
                          </Button>
                        </Link>
                        {server.status === "broken" && (
                          <>
                            <Tooltip content="Retry checking this MCP (will retry 3 times)">
                              <Button
                                size="sm"
                                isIconOnly
                                variant="light"
                                color="warning"
                                onPress={() => handleRetrySingle(server)}
                                isDisabled={retryingServers.has(server.url)}
                              >
                                <RotateCw className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                            <Tooltip content={server.error}>
                              <Button size="sm" isIconOnly variant="light" color="danger">
                                <AlertCircle className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
