export interface NodeInfo {
  specName: string;
  specVersion: string;
  bestNumber: number;
  finalizedNumber: number;
}

export interface NetworkStats {
  totalAccounts: number;
  totalNucleus: number;
  totalValidators: number;
  totalIssuance: string;
}

export interface NodeDetail {
  nodeInfo: NodeInfo;
  networkStats: NetworkStats;
} 