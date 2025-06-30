"use client";

import { Key, useEffect, useMemo } from "react";
import { Button } from "@heroui/button";
import { User } from "@heroui/user";
import { DropdownTrigger } from "@heroui/dropdown";
import { DropdownMenu } from "@heroui/dropdown";
import { DropdownItem } from "@heroui/dropdown";
import { Dropdown } from "@heroui/dropdown";
import { usePolkadotWalletStore } from "@/stores/polkadot-wallet";
import { Wallet } from "lucide-react";
import { toast } from "react-toastify";
import { formatAddress } from "@/utils/tools";

export function WalletStatus() {
  const { isConnected, selectedAccount, isConnecting, disconnectWallet, connectWallet, balance, symbol, updateBalance } = usePolkadotWalletStore();

  const formattedBalance = useMemo(() => {
    return `${balance} ${symbol}`;
  }, [balance, symbol])

  useEffect(() => {
    if (selectedAccount) {
      updateBalance();
    }
  }, [selectedAccount, updateBalance])

  if (!isConnected) {
    return (
      <Button
        variant="faded"
        startContent={<Wallet className="w-4 h-4" />}
        onPress={() => connectWallet()}
        isLoading={isConnecting}
      >
        {isConnecting ? "Connecting..." : "Connect"}
      </Button>
    );
  }

  if (!selectedAccount) {
    return null;
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Copied to clipboard");
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
  };

  const handleAction = async (key: Key) => {
    if (key === "refresh-balance") {
      updateBalance();
    } else if (key === "copy-address") {
      copyAddress(selectedAccount.address);
    } else if (key === "disconnect") {
      await handleDisconnect();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dropdown>
        <DropdownTrigger>
          <User
            name={selectedAccount.meta.name || "Wallet"}
            description={formatAddress(selectedAccount.address)}
            avatarProps={{
              name: selectedAccount.meta.name || "Wallet",
              color: "primary",
            }}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="Wallet Actions" onAction={handleAction}>
          <DropdownItem key="balance" isReadOnly>
            Balance: {formattedBalance}
          </DropdownItem>
          <DropdownItem key="refresh-balance">
            Refresh Balance
          </DropdownItem>
          <DropdownItem key="copy-address">
            Copy Address
          </DropdownItem>
          <DropdownItem key="disconnect" color="danger">
            Disconnect
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
} 