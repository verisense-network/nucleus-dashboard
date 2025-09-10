import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

export interface DnsVerificationInfo {
  subdomain: string;
  domain: string;
  recordType: 'TXT';
  recordValue: string;
  instructions: string[];
}

export function idToHexPrefix(id: string): string {
  const publicKeyBytes = decodeAddress(id);

  const first16Bytes = publicKeyBytes.slice(0, 16);
  return u8aToHex(first16Bytes, -1, false);
}

export function generateDnsVerificationInfo(
  id: string,
  domain: string,
  type: 'agent' | 'mcp'
): DnsVerificationInfo {
  const hexPrefix = idToHexPrefix(id);

  const subdomain = hexPrefix;

  const recordValue = id;

  const instructions = [
    `Add a TXT record to your DNS configuration`,
    `Record Type: TXT`,
    `Host/Name: ${subdomain}`,
    `Value: ${recordValue}`,
    `Wait 10-20 minutes for DNS propagation`,
    `Complete verification within 10 days`,
    `After successful verification, your ${type} will appear in SenseSpace`
  ];

  return {
    subdomain,
    domain,
    recordType: 'TXT',
    recordValue,
    instructions
  };
}

export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

export function extractDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}
