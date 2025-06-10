import { ApiPromise } from "@polkadot/api";

export async function setupSigner(api: ApiPromise): Promise<ApiPromise> {
  if (typeof window === 'undefined') {
    throw new Error('setupSigner only can be called in client environment');
  }

  const [
    { web3FromSource, web3Enable },
    { usePolkadotWalletStore }
  ] = await Promise.all([
    import("@polkadot/extension-dapp"),
    import("@/stores/polkadot-wallet")
  ]);

  const walletStore = usePolkadotWalletStore.getState();
  
  if (!walletStore.isConnected) {
    throw new Error('wallet not connected, please connect wallet');
  }

  const account = walletStore.selectedAccount;

  if (!account) {
    throw new Error('please select account');
  }

  try {
    const extensions = await web3Enable("Nucleus Dashboard");
    
    if (extensions.length === 0) {
      throw new Error("Polkadot wallet extension not found, please install SubWallet or other compatible wallet");
    }

    const requiredExtension = extensions.find(ext => ext.name === account.meta.source);
    if (!requiredExtension) {
      throw new Error(`wallet extension not found: ${account.meta.source}, available extensions: ${extensions.map(e => e.name).join(', ')}`);
    }

    const injector = await web3FromSource(account.meta.source);
    
    if (!injector.signer) {
      throw new Error(`wallet extension ${account.meta.source} does not support signing`);
    }
    
    api.setSigner(injector.signer);
    
    console.log(`successfully set signer for account ${account.address} (${account.meta.source})`);
    
    return api;
  } catch (error) {
    console.error('set signer failed:', error);
    throw new Error(`set signer failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
} 