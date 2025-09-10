export interface DnsVerificationInfo {
  subdomain: string;
  domain: string;
  recordType: 'TXT';
  recordValue: string;
  instructions: string[];
}

export function idToHexPrefix(id: string): string {
  const array = new Uint8Array(32);

  const encoder = new TextEncoder();
  const idBytes = encoder.encode(id);

  for (let i = 0; i < Math.min(idBytes.length, 32); i++) {
    array[i] = idBytes[i];
  }

  const first16Bytes = array.slice(0, 16);
  return Array.from(first16Bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
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
