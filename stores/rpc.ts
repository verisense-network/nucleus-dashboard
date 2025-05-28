import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Store = {
	rpcs: string[];
	setRpcs: (rpcs: string[]) => void;
	appendRpc: (rpc: string) => void;
	removeRpc: (rpc: string) => void;
};

export const useRpcStore = create<Store>()(
	persist(
		(set) => ({
			rpcs: ["http://localhost:9944"],
			setRpcs: (rpcs: string[]) => set({ rpcs }),
			appendRpc: (rpc: string) => set((state) => ({ rpcs: [...state.rpcs, rpc] })),
			removeRpc: (rpc: string) =>
				set((state) => ({ rpcs: state.rpcs.filter((r) => r !== rpc) })),
		}),
		{
			name: "rpc-storage",
			storage: createJSONStorage(() => localStorage)
		}
	)
);
