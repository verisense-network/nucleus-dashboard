"use server";

import { getNucleusListAPI, getNucleusByIdAPI, getNucleusAbiAPI } from "@/api/nucleus";
import { getNodeDetailAPI } from "@/api/node";
import { NucleusListResponse, NucleusInfo } from "@/types/nucleus";
import { NodeDetail } from "@/types/node";
import { AgentCard } from "@/types/a2a";
import { APIResponse } from "@/types/api";
import { getAgentByIdAPI, getAgentListAPI } from "@/api/rpc";

export async function getNucleusList(endpoint: string): Promise<NucleusListResponse> {
  try {
    const data = await getNucleusListAPI(endpoint);
    
    return {
      success: true,
      data,
    };
  } catch (e: any) {
    console.error("getNucleusList error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getNucleusDetail(endpoint: string, id: string): Promise<APIResponse<NucleusInfo>> {
  try {
    const data = await getNucleusByIdAPI(endpoint, id);
    
    return {
      success: true,
      data,
    };
  } catch (e: any) {
    console.error("getNucleusDetail error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getNodeDetail(endpoint: string): Promise<APIResponse<NodeDetail>> {
  try {
    const data = await getNodeDetailAPI(endpoint);
    
    return {
      success: true,
      data,
    };
  } catch (e: any) {
    console.error("getNodeDetail error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getNucleusAbi(rpcUrl: string): Promise<any> {
  try {
    const data = await getNucleusAbiAPI(rpcUrl);
    return {
      success: true,
      data,
    };
  } catch (e: any) {
    console.error("getNucleusAbi error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export type AgentInfo = {
  agentId: string;
  ownerId: string;
  agentCard: AgentCard;
}

export type AgentListResponse = APIResponse<AgentInfo[]>;

export async function getAgentList(endpoint: string): Promise<AgentListResponse> {
  try {
    const data = await getAgentListAPI(endpoint);
    return {
      success: true,
      data: data as unknown as AgentInfo[],
    };
  } catch (e: any) {
    console.error("getAgentList error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}

export async function getAgentById(endpoint: string, agentId: string): Promise<APIResponse<AgentInfo>> {
  try {
    const data = await getAgentByIdAPI(endpoint, agentId);
    return {
      success: true,
      data: data as unknown as AgentInfo,
    };
  } catch (e: any) {
    console.error("getAgentList error", e);
    return {
      success: false,
      message: e.message,
    };
  }
}