'use client';

import AgentRegistrationForm from "@/components/agent/AgentRegistrationForm";
import { useState } from "react";
import { AgentCard } from "@/types/a2a";
import { toast } from "react-toastify";
import { agentRegister } from "@/api/rpc";
import { usePolkadotWalletStore } from "@/stores/polkadot-wallet";

export default function AgentRegistrationPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: AgentCard) => {
    setIsLoading(true);
    try {
      const { isConnected, selectedAccount } = usePolkadotWalletStore.getState();
      
      if (!isConnected || !selectedAccount) {
        toast.error('please connect wallet and select account');
        return;
      }

      const finalizedHash = await agentRegister(data);

      toast.success(`Agent registration successful! Transaction finalized: ${finalizedHash.slice(0, 10)}...`);
      console.log('Transaction finalized with hash:', finalizedHash);
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed, please try again';
      toast.error(errorMessage);
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
      />
    </div>
  );
}
