import { WalletStatus } from "@/components/connectWallet";
import Logo from "./icon/Logo";
import { Divider } from "@heroui/divider";
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full h-16 border-b bg-white border-zinc-200 dark:bg-black dark:border-zinc-800 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex-shrink-0 cursor-pointer flex items-center gap-2">
          <Link href="https://verisense.network">
            <Logo />
          </Link>
          <Divider orientation="vertical" className="h-6 text-foreground" />
          <Link href="/">
            <span className="text-base font-bold">Dashboard</span>
          </Link>
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
