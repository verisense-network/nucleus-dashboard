import { WalletList } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  okxWallet,
  binanceWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { bsc } from "@/config/bscChain";

const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
const APP_NAME = process.env.NEXT_PUBLIC_WALLET_CONNECT_APP_NAME;

const recommendedWalletList: WalletList = [
  {
    groupName: "Recommended",
    wallets: [binanceWallet, metaMaskWallet, okxWallet],
  },
];
const connectors = connectorsForWallets(recommendedWalletList, {
  projectId: WALLET_CONNECT_PROJECT_ID!,
  appName: APP_NAME!,
});

export const wagmiConfig = createConfig({
  ssr: true,
  connectors,
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
});
