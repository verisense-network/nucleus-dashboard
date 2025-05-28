import { u128 } from "@verisense-network/vemodel-types/dist/codec";
import { registry } from "@verisense-network/vemodel-types";

type ThreadId = {
  community: string;
  thread: string;
  comment?: string;
};

export function decodeId(threadIdHex: string): ThreadId {
  const hex = threadIdHex.startsWith("0x")
    ? threadIdHex.substring(2)
    : threadIdHex;

  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("Invalid hex string");
  }

  const decoded = new u128(registry, Buffer.from(hex, "hex")).toHex();
  const id = decoded.slice(2);

  return {
    community: id.slice(8, 16),
    thread: id.slice(16, 24),
    comment: id.slice(0, 8),
  };
}

export function encodeId({ community, thread }: ThreadId) {
  const encoded = new u128(
    registry,
    (BigInt("0x" + community) << 64n) | (BigInt("0x" + thread) << 32n)
  );

  return encoded.toHex(true).slice(2);
}
