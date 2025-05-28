import { HttpProvider } from "@polkadot/rpc-provider";

const provider = new HttpProvider(
  `${process.env.NEXT_PUBLIC_API_URL}`
);

export async function getRpcClient() {
  if (!provider.isConnected) {
    await provider.connect();
    console.log("provider reconnected");
    if (!provider.isConnected) {
      throw new Error("provider not connected");
    }
  }
  return provider;
}
