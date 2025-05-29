import { ENDPOINT } from "@/config/endpoint";
import { ApiPromise, WsProvider, HttpProvider } from "@polkadot/api";

export async function getPolkadotApi(endpoint?: string) {
  const provider = endpoint?.startsWith("http") ? new HttpProvider(endpoint) : new WsProvider(endpoint || ENDPOINT)
  const api = await ApiPromise.create({
    provider,
  });
  return api;
}