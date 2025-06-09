"use client";

import React, { Key } from "react";
import { Button, User, DropdownTrigger, DropdownMenu, DropdownItem, Dropdown } from "@heroui/react";
import { usePolkadotWalletStore } from "@/stores/polkadot-wallet";
import { Wallet } from "lucide-react";
import { toast } from "react-toastify";

export function WalletStatus() {
  const { isConnected, selectedAccount, connectWallet, isConnecting, disconnectWallet } = usePolkadotWalletStore();

  if (!isConnected) {
    return (
      <Button
        size="sm"
        variant="bordered"
        startContent={<Wallet className="w-4 h-4" />}
        onPress={connectWallet}
        isLoading={isConnecting}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  if (!selectedAccount) {
    return null;
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Copied to clipboard");
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleAction = (key: Key) => {
    if (key === "copy-address") {
      copyAddress(selectedAccount.address);
    } else if (key === "disconnect") {
      handleDisconnect();
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
            }}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="Wallet Actions" onAction={handleAction}>
          <DropdownItem key="copy-address">
            Copy Address
          </DropdownItem>
          <DropdownItem key="disconnect">
            Disconnect
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
} 