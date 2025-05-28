import { create } from "zustand";
import { createComputed } from "zustand-computed";
import { persist, createJSONStorage } from "zustand/middleware";

type Chain = "evm" | "sol";

type SetUser = {
  chain?: Chain;
  alias?: string;
  address?: string;
  publicKey?: Uint8Array;
  lastPostAt?: number | null;
  updated?: number | null;
};

type Store = {
  chain: Chain;
  alias: string;
  address: string;
  publicKey: Uint8Array;
  lastPostAt: number | null;
  updated: number | null;
  setUser: (data: SetUser) => void;
  logout: () => void;
};

type ComputedStore = {
  isLogin: boolean;
};

const computed = createComputed(
  (state: Store): ComputedStore => ({
    isLogin: Object.values(state.publicKey).length > 0,
  })
);

export const useUserStore = create<Store>()(
  persist(
    computed((set) => ({
      chain: "evm",
      alias: "",
      address: "",
      publicKey: new Uint8Array(0),
      lastPostAt: null,
      updated: null,
      setUser: (data) => set(data),
      logout: () =>
        set({
          alias: "",
          publicKey: new Uint8Array(0),
          address: "",
          lastPostAt: null,
          updated: null,
        }),
    })),
    {
      name: "user",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any, version) => {
        if (version === 1) {
          return {
            ...persistedState,
            wallet: "MetaMask",
            updated: null,
          };
        }
        return persistedState;
      },
    }
  )
);
