import { ENDPOINT } from "@/config/endpoint";
import { ApiPromise, WsProvider } from "@polkadot/api";

const provider = new WsProvider(ENDPOINT)

export async function getPolkadotApi() {
  const api = await ApiPromise.create({
    provider,
  });
  return api;
}