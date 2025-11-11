import { AgentCard } from "./a2a";

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface AgentInfo {
  agentId: string;
  ownerId: string;
  urlVerified: boolean;
  priceRate: number;
  agentCard: AgentCard;
}