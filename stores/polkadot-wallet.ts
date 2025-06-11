import { getPolkadotApi } from "@/lib/polkadotApi";
import { create } from "zustand";
import { createComputed } from "zustand-computed";
import { persist, createJSONStorage } from "zustand/middleware";

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
  balance: string;
  symbol: string;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectAccount: (account: PolkadotAccount) => void;
  checkConnection: () => Promise<void>;
  updateBalance: () => Promise<void>;
};

type ComputedStore = {
  hasAccounts: boolean;
  selectedAddress: string | null;
  formattedBalance: string;
};

const computed = createComputed(
  (state: PolkadotWalletStore): ComputedStore => ({
    hasAccounts: state.accounts.length > 0,
    selectedAddress: state.selectedAccount?.address || null,
    formattedBalance: state.balance && state.symbol ? `${state.balance} ${state.symbol}` : "0",
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
      balance: "0",
      symbol: "",

      connectWallet: async () => {
        try {
          set({ isConnecting: true, error: null });

          const { web3Enable, web3Accounts } = await import("@polkadot/extension-dapp");

          const extensions = await web3Enable("Nucleus Dashboard");
          
          if (extensions.length === 0) {
            throw new Error("not found Polkadot wallet extension, please install SubWallet");
          }

          const subWallet = extensions.find((ext: any) => 
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

          const formattedAccounts: PolkadotAccount[] = accounts.map((account: any) => ({
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

          get().updateBalance();
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
          balance: "0",
          symbol: "",
        });
      },

      selectAccount: (account: PolkadotAccount) => {
        set({ selectedAccount: account });
        get().updateBalance();
      },

      checkConnection: async () => {
        try {
          const { web3Enable, web3Accounts } = await import("@polkadot/extension-dapp");

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

          const formattedAccounts: PolkadotAccount[] = accounts.map((account: any) => ({
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

      updateBalance: async () => {
        try {
          const currentState = get();
          if (!currentState.selectedAccount) {
            return;
          }

          const api = await getPolkadotApi();
          const accountInfo = await api.query.system.account(currentState.selectedAccount.address);
          
          const balanceData = (accountInfo as any).data;
          const freeBalance = balanceData.free;
          
          const decimals = api.registry.chainDecimals[0] || 10;
          const symbol = api.registry.chainTokens[0] || 'DOT';
          
          const balanceBigInt = BigInt(freeBalance.toString());
          const divisor = BigInt(10 ** decimals);
          
          const integerPart = balanceBigInt / divisor;
          const fractionalPart = balanceBigInt % divisor;
          
          const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
          const trimmedFractional = fractionalStr.replace(/0+$/, '');
          
          const balanceInDecimal = trimmedFractional.length > 0 
            ? `${integerPart}.${trimmedFractional}`
            : integerPart.toString();
            
          set({
            balance: balanceInDecimal,
            symbol: symbol
          });
        } catch (error) {
          console.error("ERR updateBalance:", error);
          set({ balance: "0", symbol: "" });
        }
      },
    })),
    {
      name: "polkadot-wallet",
      storage: createJSONStorage(() => {
        return typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      version: 1,
      partialize: (state) => ({
        selectedAccount: state.selectedAccount,
        accounts: state.accounts,
        isConnected: state.isConnected,
        balance: state.balance,
        symbol: state.symbol,
      }),
    }
  )
); 