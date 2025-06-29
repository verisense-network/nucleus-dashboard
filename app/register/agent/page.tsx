'use client';

import AgentRegistrationForm from "@/components/agent/AgentRegistrationForm";
import { useState } from "react";
import { AgentCard } from "@/types/a2a";
import { toast } from "react-toastify";
import { usePolkadotWalletStore } from "@/stores/polkadot-wallet";
import { invalidateCache } from "@/app/actions";
import { useEndpointStore } from "@/stores/endpoint";
import { useSearchParams } from "next/navigation";
import { registerAgent } from "@/api/rpc";

export default function AgentRegistrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { endpoint } = useEndpointStore();
  const searchParams = useSearchParams();
  const agentCardId = searchParams.get('agentCardId');

  const handleSubmit = async (data: AgentCard) => {
    setIsLoading(true);
    const toastId = toast.loading('Continue in your wallet...');
    console.log('data', data);
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

      const resFinalizedHash = await registerAgent(endpoint, data, toastId, agentCardId);

      toast.update(toastId, {
        type: 'success',
        render: `Agent registration successful! Transaction finalized: ${resFinalizedHash.slice(0, 10)}...`,
        isLoading: false,
        autoClose: 3500,
      });
      console.log('Transaction finalized with hash:', resFinalizedHash);

      invalidateCache('/');
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
    <div className="w-full mx-auto py-4 space-y-6">
      <h1 className="text-2xl font-bold">Register Agent</h1>
      <AgentRegistrationForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        agentCardId={agentCardId}
      />
    </div>
  );
}
