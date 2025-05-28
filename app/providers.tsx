"use client";

import { SWRConfig } from "swr";
import { HeroUIProvider } from "@heroui/react";
import { ToastContainer } from "react-toastify";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/navigation";
import TourProvider from "@/lib/tour";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider attribute="class" defaultTheme="light">
        <ToastContainer autoClose={3500} toastClassName="mt-1 max-w-[98vw]" />
        <SWRConfig
          value={{
            refreshInterval: 30000,
            fetcher: (resource, init) =>
              fetch(resource, init).then((res) => res.json()),
          }}
        >
          <TourProvider>
            {children}
          </TourProvider>
        </SWRConfig>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
