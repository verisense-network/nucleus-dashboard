"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { WalletStatus } from "@/components/connectWallet";

export default function Header() {
  const router = useRouter();

  const toHomePage = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <header className="fixed top-0 left-0 w-full h-16 border-b bg-white border-zinc-200 dark:bg-black dark:border-zinc-800 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex-shrink-0 cursor-pointer" onClick={toHomePage}>
          Dashboard
        </div>
        <div className="max-w-xl w-full mx-4">
        </div>
        <div className="flex-shrink-0 flex space-x-1 md:space-x-5 items-center">
          <WalletStatus />
        </div>
      </div>
    </header>
  );
}
