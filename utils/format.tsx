import { Tooltip } from "@heroui/tooltip";
import { formatAddress } from "./tools";
import { ethers } from "ethers";
import { CHAIN } from "./chain";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { twMerge } from "tailwind-merge";
import { ReactNode } from "react";

interface AddressViewFormatProps {
  address: string;
  bracket?: boolean;
  className?: string;
}

export function AddressViewFormat({
  address,
  bracket = true,
  className,
}: AddressViewFormatProps) {
  return (
    <Tooltip content={address}>
      <span className={twMerge("text-gray-800 text-sm", className)}>
        {bracket ? `(${formatAddress(address)})` : formatAddress(address)}
      </span>
    </Tooltip>
  );
}

interface NamedAddressViewProps {
  address: string;
  name?: string;
  nameSuffix?: ReactNode;
  classNames?: {
    name?: string;
    address?: string;
  };
}

export function NamedAddressView({
  address,
  name,
  nameSuffix,
  classNames,
}: NamedAddressViewProps) {
  return (
    <div className="space-x-2">
      <span className={twMerge("text-xs", classNames?.name)}>
        {(name && (name.startsWith("0x") ? name.slice(0, 4) : name)) || ""}
      </span>
      {nameSuffix}
      <AddressViewFormat className={classNames?.address} address={address} />
    </div>
  );
}

export const VIEW_UNIT = CHAIN === "SOL" ? "SOL" : CHAIN === "BSC" ? "BNB" : "";

export function formatReadableAmount(
  amount: string | number,
  decimal?: number
): string {
  if (!amount || Number.isNaN(Number(amount))) return "";
  const amt = typeof amount === "number" ? `${amount}` : amount;
  if (CHAIN === "SOL") {
    return (Number(amt) / LAMPORTS_PER_SOL).toString();
  } else {
    const value =
      typeof decimal === "number"
        ? ethers.formatUnits(amt, decimal)
        : ethers.formatEther(amt);
    return Number(value).toLocaleString();
  }
}

export function formatAmount(
  amount: string | number,
  decimal?: number
): bigint {
  if (!amount || Number.isNaN(Number(amount))) return 0n;

  const amt = typeof amount === "number" ? `${amount}` : amount;
  if (CHAIN === "SOL") {
    return BigInt(amt) * BigInt(LAMPORTS_PER_SOL);
  } else {
    return typeof decimal === "number"
      ? ethers.parseUnits(amt, decimal)
      : ethers.parseEther(amt);
  }
}
