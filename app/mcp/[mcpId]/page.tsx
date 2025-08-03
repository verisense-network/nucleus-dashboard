"use client";

import { getMcpServerById } from "@/app/actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { ArrowLeft, Server, ExternalLink, Globe, FileText, Copy } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { useHydrationEndpointStore } from "@/stores/endpoint";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from "@heroui/react";
import { McpServer } from "@/types/mcp";
import { wrapApiRequest } from "@/utils/api";
import { deregisterMcp, getMcpServerByIdAPI } from "@/api/rpc";
import { toast } from "react-toastify";
import { usePolkadotWalletStore } from "@/stores/polkadot-wallet";
import { useRouter } from "next/navigation";

interface McpDetailPageProps {
  params: Promise<{
    mcpId: string;
  }>;
}

export default function McpDetailPage({ params }: McpDetailPageProps) {
  const { mcpId } = use(params);
  const [{ endpoint, isLocalNode }, hydrated] = useHydrationEndpointStore(state => state);
  const { selectedAddress } = usePolkadotWalletStore();

  const [mcpServer, setMcpServer] = useState<McpServer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

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

  const handleCopyUrl = useCallback(() => {
    if (mcpServer?.url) {
      navigator.clipboard.writeText(mcpServer.url);
      toast.success("MCP Server URL copied to clipboard");
    }
  }, [mcpServer]);

  const onDelete = useCallback(async () => {
    if (!mcpServer) return;

    setIsDeleting(true);
    const toastId = toast.loading('Deleting...');
    try {
      const res = await deregisterMcp(endpoint, mcpServer.id, toastId);
      toast.update(toastId, {
        type: 'success',
        render: `MCP Server deleted! Transaction finalized: ${res.slice(0, 10)}...`,
        isLoading: false,
      });
      router.push("/");
      setIsOpenDeleteModal(false);
    } catch (error) {
      console.error(error);
      toast.update(toastId, {
        type: 'error',
        render: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    } finally {
      setIsDeleting(false);
      toast.dismiss();
    }
  }, [endpoint, mcpServer, router]);

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

  return (
    <div className="w-full mx-auto py-4 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
            Back to Home
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center gap-3 w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold">{mcpServer?.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Chip variant="flat" color="primary" size="sm">
                    MCP Server
                  </Chip>
                </div>
              </div>
            </div>
            <div>
              {mcpServer?.provider === selectedAddress && (
                <Button color="danger" onPress={() => setIsOpenDeleteModal(true)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText size={20} />
              Description
            </h3>
            <div className="bg-default-50 rounded-lg p-4">
              <p className="text-default-700">
                {mcpServer?.description || "No description available"}
              </p>
            </div>
          </div>

          <Divider />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Globe size={20} />
              Server URL
            </h3>
            <div className="bg-default-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono bg-default-100 px-2 py-1 rounded">
                  {mcpServer?.url}
                </code>
                {mcpServer?.url && (
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Copy size={14} />}
                    onPress={handleCopyUrl}
                  >
                    Copy URL
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Divider />

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
      <Modal isOpen={isOpenDeleteModal} onOpenChange={setIsOpenDeleteModal}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semold">Delete MCP Server</h3>
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete this MCP Server?</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={() => onDelete()} isLoading={isDeleting}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
