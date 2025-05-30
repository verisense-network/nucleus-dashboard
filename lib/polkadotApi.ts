import { ENDPOINT } from "@/config/endpoint";
import { ApiPromise, WsProvider, HttpProvider } from "@polkadot/api";

export async function getPolkadotApi(endpoint?: string) {
  const url = endpoint || ENDPOINT;
  const provider = url.startsWith("http") ? new HttpProvider(url) : new WsProvider(url)
  const api = await ApiPromise.create({
    provider,
  });
  return api;
}