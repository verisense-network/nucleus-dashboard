import { getPolkadotApi } from "@/lib/polkadotApi";
import { AgentCard } from "@/types/a2a";
import { Id, toast } from "react-toastify";

export async function agentRegister(agentCard: AgentCard, toastId: Id): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('agentRegister can only be called in client environment');
  }

  const [
    { setupSigner },
    { usePolkadotWalletStore },
  ] = await Promise.all([
    import("@/utils/polkadot-signer"),
    import("@/stores/polkadot-wallet"),
  ]);

  const api = await getPolkadotApi();
  await setupSigner(api);

  const extrinsic = api.tx.a2a.register(agentCard);

  const account = usePolkadotWalletStore.getState().selectedAccount;

  if (!account) {
    throw new Error('please connect wallet and select account');
  }

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(account.address, (result) => {
      if (result.status.isInBlock) {
        toast.update(toastId, {
          type: 'info',
          render: 'Transaction included in block...',
          isLoading: true,
          autoClose: false,
        });
        console.log('transaction included in block:', result.status.asInBlock.toHex());
      } else if (result.status.isFinalized) {
        toast.update(toastId, {
          type: 'success',
          render: 'Transaction finalized!',
          isLoading: false,
        });
        console.log('transaction finalized:', result.status.asFinalized.toHex());
        resolve(result.status.asFinalized.toHex());
      }

      if (result.dispatchError) {
        if (result.dispatchError.isModule) {
          const decoded = api.registry.findMetaError(result.dispatchError.asModule);
          const { docs, method, section } = decoded;
          console.error(`module error: ${section}.${method}: ${docs.join(' ')}`);
          reject(new Error(`transaction failed: ${section}.${method}: ${docs.join(' ')}`));
        } else {
          console.error('transaction error:', result.dispatchError.toString());
          reject(new Error(`transaction failed: ${result.dispatchError.toString()}`));
        }
      }
    }).catch((error) => {
      console.error('sign or send transaction failed:', error);
      reject(new Error(`sign or send transaction failed: ${error.message}`));
    });
  });
}

export async function getAgentListAPI(): Promise<AgentCard[]> {
  const api = await getPolkadotApi();

  const result = await api.call.a2aRuntimeApi.getAllAgents();
  return result.toHuman() as unknown as AgentCard[];
}

export async function getAgentByIdAPI(agentId: string): Promise<AgentCard> {
  const api = await getPolkadotApi();
  const result = await api.call.a2aRuntimeApi.findAgent(agentId);
  return result.toHuman() as unknown as AgentCard;
}