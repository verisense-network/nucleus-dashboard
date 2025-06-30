"use client";

import { ENDPOINT } from "@/config/endpoint";
import { clearAllConnections } from "@/lib/polkadotApi";
import { useEffect, useState } from "react";
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
  isLocalNode: (endpoint: string) => boolean;
};

export const useEndpointStore = create<Store>()(
  persist(
    (set, get) => ({
      status: "disconnected",
      endpoint: "",
      endpoints: [ENDPOINT, "ws://localhost:9955"],
      isLocalNode: (endpoint: string) => {
        return endpoint.includes("localhost") || endpoint.includes("127.0.0.1") || endpoint.includes("192.168.");
      },
      setEndpoint: (endpoint: string) => {
        const { endpoints } = get();
        const newEndpoints = [endpoint, ...endpoints].filter((e, index, self) => self.indexOf(e) === index);
        clearAllConnections();
        return set({
          endpoint: newEndpoints[0],
          endpoints: newEndpoints,
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

export function useHydrationEndpointStore<T>(selector: (state: Store) => T): [T, boolean] {
  const [hydrated, setHydrated] = useState(false)
  
  const value = useEndpointStore(selector) as T;
  
  useEffect(() => {
    setHydrated(true)
  }, [])
  
  return [value, hydrated]
}