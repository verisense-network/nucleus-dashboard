import { create } from "zustand";
import { createComputed } from "zustand-computed";
import { persist, createJSONStorage } from "zustand/middleware";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";

export interface PolkadotAccount {
  address: string;
  meta: {
    name?: string;
    source: string;
    genesisHash?: string | null;
  };
  type?: string;
}

type PolkadotWalletStore = {
  isConnected: boolean;
  isConnecting: boolean;
  accounts: PolkadotAccount[];
  selectedAccount: PolkadotAccount | null;
  error: string | null;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectAccount: (account: PolkadotAccount) => void;
  checkConnection: () => Promise<void>;
};

type ComputedStore = {
  hasAccounts: boolean;
  selectedAddress: string | null;
};

const computed = createComputed(
  (state: PolkadotWalletStore): ComputedStore => ({
    hasAccounts: state.accounts.length > 0,
    selectedAddress: state.selectedAccount?.address || null,
  })
);

export const usePolkadotWalletStore = create<PolkadotWalletStore>()(
  persist(
    computed((set, get) => ({
      isConnected: false,
      isConnecting: false,
      accounts: [],
      selectedAccount: null,
      error: null,

      connectWallet: async () => {
        try {
          set({ isConnecting: true, error: null });

          const extensions = await web3Enable("Nucleus Dashboard");
          
          if (extensions.length === 0) {
            throw new Error("not found Polkadot wallet extension, please install SubWallet");
          }

          const subWallet = extensions.find(ext => 
            ext.name.toLowerCase().includes("subwallet") || 
            ext.name.toLowerCase().includes("polkadot")
          );
          
          if (!subWallet) {
            console.warn("not found SubWallet, will use other available wallets");
          }

          const accounts = await web3Accounts({
            accountType: ["sr25519"],
            ss58Format: 137,
          });
          
          if (accounts.length === 0) {
            throw new Error("no available accounts in the wallet, please create or import accounts in the wallet");
          }

          const formattedAccounts: PolkadotAccount[] = accounts.map(account => ({
            address: account.address,
            meta: account.meta,
            type: account.type,
          }));

          set({
            isConnected: true,
            isConnecting: false,
            accounts: formattedAccounts,
            selectedAccount: formattedAccounts[0], // default select the first account
            error: null,
          });

        } catch (error) {
          console.error("connect wallet failed:", error);
          set({
            isConnecting: false,
            error: error instanceof Error ? error.message : "connect wallet failed",
            isConnected: false,
            accounts: [],
            selectedAccount: null,
          });
        }
      },

      disconnectWallet: () => {
        set({
          isConnected: false,
          accounts: [],
          selectedAccount: null,
          error: null,
        });
      },

      selectAccount: (account: PolkadotAccount) => {
        set({ selectedAccount: account });
      },

      checkConnection: async () => {
        try {
          const extensions = await web3Enable("Nucleus Dashboard");
          if (extensions.length === 0) {
            set({ isConnected: false, accounts: [], selectedAccount: null });
            return;
          }

          const accounts = await web3Accounts();
          if (accounts.length === 0) {
            set({ isConnected: false, accounts: [], selectedAccount: null });
            return;
          }

          const formattedAccounts: PolkadotAccount[] = accounts.map(account => ({
            address: account.address,
            meta: account.meta,
            type: account.type,
          }));

          const currentState = get();
          const selectedStillExists = currentState.selectedAccount && 
            formattedAccounts.some(acc => acc.address === currentState.selectedAccount?.address);

          set({
            isConnected: true,
            accounts: formattedAccounts,
            selectedAccount: selectedStillExists 
              ? currentState.selectedAccount 
              : formattedAccounts[0] || null,
          });

        } catch (error) {
          console.error("check connection status failed:", error);
          set({
            isConnected: false,
            accounts: [],
            selectedAccount: null,
          });
        }
      },
    })),
    {
      name: "polkadot-wallet",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        selectedAccount: state.selectedAccount,
        accounts: state.accounts,
        isConnected: state.isConnected,
      }),
    }
  )
); 