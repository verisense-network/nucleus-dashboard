import { getPolkadotApi } from "@/lib/polkadotApi";
import { NetworkStats, NodeDetail, NodeInfo } from "@/types/node";

export async function getNodeInfoAPI(endpoint: string): Promise<NodeInfo> {
  const api = await getPolkadotApi(endpoint);

  const latestHeader = await api.rpc.chain.getHeader();
  const bestNumber = latestHeader.number.toNumber();

  const finalizedHash = await api.rpc.chain.getFinalizedHead();
  const finalizedHeader = await api.rpc.chain.getHeader(finalizedHash);
  const finalizedNumber = finalizedHeader.number.toNumber();

  const { specName, specVersion } = api.runtimeVersion;

  return {
    specName: specName.toString(),
    specVersion: specVersion.toString(),
    bestNumber,
    finalizedNumber,
  };
}

export async function getNetworkStatsAPI(endpoint: string): Promise<NetworkStats> {
  const api = await getPolkadotApi(endpoint);
  const totalAccounts = (await api.query.system.account.entries()).length;
  const totalNucleus = (await api.query.nucleus.nuclei.entries()).length;

  const validators = await api.query.session.validators();
  const totalValidators = (validators.toJSON() as any)?.length;

  const totalIssuance = await api.query.balances.totalIssuance();

  return {
      totalAccounts,
      totalNucleus,
      totalValidators,
      totalIssuance: totalIssuance.toString(),
  };
}

export async function getNodeDetailAPI(endpoint: string): Promise<NodeDetail> {
  const nodeInfo = await getNodeInfoAPI(endpoint);
  const networkStats = await getNetworkStatsAPI(endpoint);

  return {
    nodeInfo,
    networkStats,
  };
} 