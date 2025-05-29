import { getPolkadotApi } from "@/lib/polkadotApi";
import alovaInstance from "@/lib/request";
import { NucleusInfo } from "@/types/nucleus";
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";

const VERISENSE_PREFIX = 137

export async function getNucleusListAPI(): Promise<NucleusInfo[]> {
  const api = await getPolkadotApi();
  
  const entries = await api.query.nucleus.nuclei.entries();

  const result = entries.map(([key, value]) => {
    const keyBytes = key.toU8a();
    let nucleusId = '';
    if (keyBytes.length >= 32) {
        const idBytes = keyBytes.slice(keyBytes.length - 32);
        const idAddress = encodeAddress(idBytes, VERISENSE_PREFIX);
        nucleusId = idAddress;
    }

    const data = value.toHuman() as Omit<NucleusInfo, 'id'>

    return {
      id: nucleusId,
      ...data,
    };
  })

  const filteredResult = result.filter((item) => !item.wasmHash.startsWith('0x0000000000000000000000000000000000000000000000000000000000000000'));

  return filteredResult;
}

export async function getNucleusByIdAPI(id: string): Promise<NucleusInfo> {
  const api = await getPolkadotApi();

  const accountId = decodeAddress(id);

  const nucleus = await api.query.nucleus.nuclei(accountId);

  if (!nucleus) {
    throw new Error(`Failed to fetch nucleus detail: ${nucleus}`);
  }
  const keyBytes = nucleus.toU8a();
  let nucleusId = '';
  if (keyBytes.length >= 32) {
      const idBytes = keyBytes.slice(keyBytes.length - 32);
      const idAddress = encodeAddress(idBytes, VERISENSE_PREFIX);
      nucleusId = idAddress;
  }

  return {
    id: nucleusId,
    ...(nucleus.toHuman() as unknown as Omit<NucleusInfo, 'id'>),
  };
}

export async function getNucleusAbiAPI(id: string): Promise<any> {
  const res = await alovaInstance.Get<{ data: any }>(`/api/nucleus/${id}/abi`);

  if (!res.data) {
    throw new Error(`Failed to fetch nucleus ABI: ${res}`);
  }

  return res.data;
}