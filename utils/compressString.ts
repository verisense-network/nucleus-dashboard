import pako from "pako";

export function compressString(str: string): Uint8Array {
  const uint8Array = new TextEncoder().encode(str);
  const compressed = pako.gzip(uint8Array);
  return compressed;
}

export function decompressString(compressed: Uint8Array): string {
  try {
    const decompressed = pako.ungzip(new Uint8Array(compressed));
    return new TextDecoder().decode(decompressed);
  } catch (e) {
    console.error("[decompressString] error", e, compressed);
    return "> __DECOMPRESS_ERROR__";
  }
}
