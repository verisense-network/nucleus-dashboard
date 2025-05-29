"use server";

import { getNucleusListAPI, getNucleusByIdAPI, getNucleusAbiAPI } from "@/api/nucleus";
import { getNodeDetailAPI } from "@/api/node";
import { NucleusListResponse, NucleusInfo } from "@/types/nucleus";
import { NodeDetail } from "@/types/node";

export async function getNucleusList(): Promise<NucleusListResponse> {
  try {
    const data = await getNucleusListAPI();
    
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

export async function getNucleusDetail(id: string): Promise<{
  success: boolean;
  data?: NucleusInfo;
  message?: string;
}> {
  try {
    const data = await getNucleusByIdAPI(id);
    
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

export async function getNodeDetail(): Promise<{
  success: boolean;
  data?: NodeDetail;
  message?: string;
}> {
  try {
    const data = await getNodeDetailAPI();
    
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

export async function getNucleusAbi(id: string): Promise<any> {
  try {
    const data = await getNucleusAbiAPI(id);
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