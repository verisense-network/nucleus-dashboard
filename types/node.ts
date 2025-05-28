export interface NodeInfo {
  spec_name: string;
  spec_version: string;
  best_block: number;
  finalized_block: number;
}

export interface NetworkStats {
  total_accounts: number;
  total_nucleus: number;
  total_validators: number;
  active_validators: number;
  total_issuance: string;
  staking_ratio: number;
}

export interface NodeDetail {
  node_info: NodeInfo;
  network_stats: NetworkStats;
  endpoint: string;
} 