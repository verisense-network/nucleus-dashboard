import alovaInstance from "@/lib/request";
import { NodeDetail } from "@/types/node";

export async function getNodeDetailAPI(): Promise<NodeDetail> {
  const res = await alovaInstance.Get<{ data: NodeDetail }>("/api/node/detail").send(true);

  if (!res.data) {
    throw new Error(`Failed to fetch node detail: ${res}`);
  }

  return res.data;
} 