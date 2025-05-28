import "@rainbow-me/rainbowkit/styles.css";

import {
  darkTheme,
  DisclaimerComponent,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { wagmiConfig } from "@/config/wagmi";

const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
  <Text>
    By connecting your wallet, you agree to the{" "}
    <Link href="/legals/terms-of-service">Terms of Service</Link>
  </Text>
);

const queryClient = new QueryClient();

export default function RainbowProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          appInfo={{
            appName: "Nucleus Dashboard",
            disclaimer: Disclaimer,
          }}
          theme={darkTheme({
            borderRadius: "medium",
          })}
          initialChain={bsc}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
