'use client';

import McpRegistrationForm from "@/components/mcp/McpRegistrationForm";
import { Suspense, useState } from "react";
import { McpServer } from "@/types/mcp";
import { toast } from "react-toastify";
import { usePolkadotWalletStore } from "@/stores/polkadot-wallet";
import { useEndpointStore } from "@/stores/endpoint";
import { registerMcp } from "@/api/rpc";
import { Spinner } from "@heroui/react";

export default function McpRegistrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { endpoint } = useEndpointStore();

  const handleSubmit = async (data: McpServer) => {
    setIsLoading(true);
    const toastId = toast.loading('Continue in your wallet...');
    try {
      const { isConnected, selectedAccount } = usePolkadotWalletStore.getState();

      if (!isConnected || !selectedAccount) {
        console.error('not connected');
        toast.update(toastId, {
          type: 'error',
          render: 'please connect wallet and select account',
          isLoading: false,
          autoClose: 3500,
        });
        return;
      }

      const resFinalizedHash = await registerMcp(endpoint, data, toastId);

      toast.update(toastId, {
        type: 'success',
        render: `MCP Server registration successful! Transaction finalized: ${resFinalizedHash.slice(0, 10)}...`,
        isLoading: false,
        autoClose: 3500,
      });
      console.log('Transaction finalized with hash:', resFinalizedHash);

    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed, please try again';
      toast.update(toastId, {
        type: 'error',
        render: errorMessage,
        isLoading: false,
        autoClose: 3500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<Spinner size="lg" />}>
      <div className="w-full mx-auto py-4 space-y-6">
        <h1 className="text-2xl font-bold">Register MCP Server</h1>
        <McpRegistrationForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </Suspense>
  );
}
