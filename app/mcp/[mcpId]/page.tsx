"use client";

import { getMcpServerById } from "@/app/actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { ArrowLeft, Server, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { cn, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from "@heroui/react";
import { McpServer, McpServerDetails } from "@/types/mcp";
import { toast } from "react-toastify";
import { ENDPOINT } from "@/config/endpoint";
import { McpServerSDKDisplay } from "@/components/mcp";
import { useHydrationEndpointStore } from "@/stores/endpoint";
import { usePolkadotWalletStore } from "@/stores/polkadot-wallet";
import { deregisterMcp } from "@/api/rpc";
import { useRouter } from "next/navigation";

interface McpDetailPageProps {
  params: Promise<{
    mcpId: string;
  }>;
}

export default function McpDetailPage({ params }: McpDetailPageProps) {
  const { mcpId } = use(params);
  const router = useRouter();
  const [{ endpoint, isLocalNode }, hydrated] = useHydrationEndpointStore(state => state);
  const { selectedAddress } = usePolkadotWalletStore();

  const [mcpServer, setMcpServer] = useState<McpServer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const fetchMcpServer = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setIsLoading(true);
      }
      setError(null);

      const result = await getMcpServerById(ENDPOINT, mcpId);

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
  }, [mcpId]);

  useEffect(() => {
    fetchMcpServer();
  }, [fetchMcpServer]);

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
      <div className="container mx-auto px-4 py-4">
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
      <div className="container mx-auto px-4 py-4">
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
    <div className="container mx-auto px-4  py-4 space-y-6">
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
            <div className="flex justify-between items-center gap-3 w-full">
              <div className="flex gap-3">
                <div className="p-2 bg-primary/10 rounded-lg w-10 h-10 mt-2">
                  <Server className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold">{mcpServer?.name}</h1>
                  <div className="flex items-start gap-2 mt-1">
                    <div className="flex flex-col items-end flex-1">
                      <span
                        className={cn('text-sm text-default-500 whitespace-break-spaces', {
                          'line-clamp-2': !isDescriptionExpanded
                        })}
                      >
                        {mcpServer?.description}
                      </span>
                      {mcpServer?.description && mcpServer.description.length > 100 && (
                        <Button
                          variant="light"
                          size="sm"
                          className="w-fit mt-1 text-xs h-6 px-2"
                          startContent={
                            isDescriptionExpanded ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )
                          }
                          onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        >
                          {isDescriptionExpanded ? "Show Less" : "Show More"}
                        </Button>
                      )}
                    </div>
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
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {mcpServer?.url && (
            <div className="pt-4">
              <McpServerSDKDisplay
                server={mcpServer}
                autoFetch={true}
              />
            </div>
          )}
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
    </div >
  );
}
