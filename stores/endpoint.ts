import { ENDPOINT } from "@/config/endpoint";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type EndpointStatus = "connecting" | "connected" | "disconnected";

type Store = {
  status: EndpointStatus;
  endpoint: string;
  endpoints: string[];
  setEndpoint: (endpoint: string) => void;
  removeEndpoint: (endpoint: string) => void;
  setStatus: (status: EndpointStatus) => void;
};

export const useEndpointStore = create<Store>()(
  persist(
    (set, get) => ({
      status: "disconnected",
      endpoint: "",
      endpoints: [ENDPOINT],
      setEndpoint: (endpoint: string) => {
        const { endpoints } = get();

        return set({
          endpoint,
          endpoints: [...new Set([endpoint, ...endpoints])],
          status: "connecting"
        })
      },
      removeEndpoint: (endpoint: string) => {
        const { endpoints } = get();
        const newEndpoints = endpoints.filter((e) => e !== endpoint);
        return set({
          endpoints: newEndpoints,
          endpoint: newEndpoints[0] || ENDPOINT
        })
      },
      setStatus: (status: EndpointStatus) => {
        return set({ status })
      }
    }),
    { name: "endpoint", storage: createJSONStorage(() => localStorage) }
  )
);