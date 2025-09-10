'use client';

import AgentRegistrationForm from "@/components/agent/AgentRegistrationForm";
import { Suspense, useState } from "react";
import { AgentCard } from "@/types/a2a";
import { toast } from "react-toastify";
import { usePolkadotWalletStore } from "@/stores/polkadot-wallet";
import { useEndpointStore } from "@/stores/endpoint";
import { registerAgent } from "@/api/rpc";
import { Spinner } from "@heroui/react";
import { updateAirdropTaskForAgent } from "@/app/actions";
import TaskCompletionModal from "@/components/modal/TaskCompletionModal";

export default function AgentRegistrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const { endpoint } = useEndpointStore();

  const handleSubmit = async (data: AgentCard, priceRate?: number, updateAgentId?: string | null) => {
    setIsLoading(true);
    const toastId = toast.loading('Continue in your wallet...');
    console.log('data', data);
    console.log('priceRate', priceRate);
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

      const resFinalizedHash = await registerAgent(endpoint, data, priceRate, toastId, updateAgentId);

      if (selectedAccount.address) {
        try {
          const airdropResult = await updateAirdropTaskForAgent(selectedAccount.address);
          if (airdropResult.success) {
            setShowTaskCompletionModal(true);
          } else {
            console.warn('Airdrop task update failed:', airdropResult.message);
          }
        } catch (airdropError) {
          console.error('Failed to update airdrop task:', airdropError);
        }
      }

      toast.update(toastId, {
        type: 'success',
        render: `Agent registration successful! Transaction finalized: ${resFinalizedHash.slice(0, 10)}...`,
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
        <h1 className="text-2xl font-bold">Register Agent</h1>
        <AgentRegistrationForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
      <TaskCompletionModal
        isOpen={showTaskCompletionModal}
        onClose={() => setShowTaskCompletionModal(false)}
        taskType="agent"
      />
    </Suspense>
  );
}
