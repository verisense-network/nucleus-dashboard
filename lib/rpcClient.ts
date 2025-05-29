import { ENDPOINT } from "@/config/endpoint";
import { HttpProvider, WsProvider } from "@polkadot/rpc-provider";

export async function getRpcClient(endpoint?: string) {
  const provider = endpoint?.startsWith("http") ? new HttpProvider(endpoint) : new WsProvider(endpoint || ENDPOINT);
  if (!provider.isConnected) {
    await provider.connect();
    console.log("provider reconnected");
    if (!provider.isConnected) {
      throw new Error("provider not connected");
    }
  }
  return provider;
}
