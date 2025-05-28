import dayjs from "@/lib/dayjs";
import { CHAIN } from "./chain";
import bs58 from "bs58";

export function stringToHex(str: string) {
  return Buffer.from(str, "utf-8").toString("hex");
}

export const isDev = process.env.NODE_ENV === "development";

export function hexToBytes(hexString: string) {
  const hex = hexString.startsWith("0x") ? hexString.substring(2) : hexString;

  if (!hex.length) return new Uint8Array(0);

  const cleanHex = hex.length % 2 ? "0" + hex : hex;

  const bytes = new Uint8Array(cleanHex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    const byteIndex = i * 2;
    const byte = parseInt(cleanHex.substr(byteIndex, 2), 16);
    bytes[i] = byte;
  }

  return bytes;
}

export function hexToLittleEndian(hex: string): string {
  const hexStr = hex.startsWith("0x") ? hex.substring(2) : hex;
  const buffer = Buffer.from(hexStr, "hex");
  const littleEndianHex = buffer.reverse().toString("hex");
  return littleEndianHex;
}

export function formatTimestamp(
  timestamp: number,
  relative: boolean = true,
  format: string = "YYYY-MM-DD HH:mm"
) {
  const date = dayjs.unix(timestamp);
  const now = dayjs();
  const diff = now.diff(date, "day");

  if (diff < 7 && relative) {
    return date.fromNow();
  }

  return date.format(format);
}

export function formatAddress(address: string) {
  return address.slice(0, 4) + "..." + address.slice(-4);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(this: any, ...args: Parameters<T>): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

export async function sleep(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

export function convertStoredPublicKeyToHex(publicKey: Uint8Array) {
  return `0x${Buffer.from(Object.values(publicKey)).toString("hex")}`;
}

export function extractWagmiErrorDetailMessage(err: any) {
  const regex = /Details: (.+)/;
  const match = err?.message.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  } else {
    return err?.message || err;
  }
}

export function isBase58Encoded(str: string) {
  const base58Chars =
    /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

  if (!str || !base58Chars.test(str)) {
    return false;
  }

  try {
    const decoded = bs58.decode(str);
    return decoded.length > 0;
  } catch (e) {
    return false;
  }
}

export type BuildEnv = "test" | "prod";

export function isBuildEnv(env: BuildEnv) {
  return process.env.NEXT_PUBLIC_BUILD_ENV === env;
}

export function getAddressLink(
  address: string,
  type: "address" | "token" = "address"
) {
  let link: string;
  if (CHAIN === "BSC") {
    link = `https://bscscan.com/${type}/${address}`;
  } else {
    link = `https://solscan.io/${type}/${address}`;
  }
  return link;
}

export const BNBDecimal = 18;

export const UPLOAD_IMAGE_ACCEPT = {
  "image/jpeg": [".jpeg", ".jpg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

// 1M in bytes
export const MAX_IMAGE_SIZE = 1024 * 1024;
