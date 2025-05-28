import alovaInstance from "@/lib/request";
import { NucleusInfo } from "@/types/nucleus";

export async function getNucleusListAPI(): Promise<NucleusInfo[]> {
  const res = await alovaInstance.Get<{ data: NucleusInfo[] }>("/api/nucleus");

  if (!res.data) {
    throw new Error(`Failed to fetch nucleus list: ${res}`);
  }

  return res.data;
}

export async function getNucleusDetailAPI(id: string): Promise<NucleusInfo> {
  const res = await alovaInstance.Get<{ data: NucleusInfo }>(`/api/nucleus/${id}`);

  if (!res.data) {
    throw new Error(`Failed to fetch nucleus detail: ${res}`);
  }

  return res.data;
}

export async function getNucleusAbiAPI(id: string): Promise<any> {
  const res = await alovaInstance.Get<{ data: any }>(`/api/nucleus/${id}/abi`);

  if (!res.data) {
    throw new Error(`Failed to fetch nucleus ABI: ${res}`);
  }

  return res.data;
}