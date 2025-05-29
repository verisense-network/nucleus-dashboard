export interface NucleusInfo {
  id: string;
  name: string;
  manager: string;
  wasmHash: string;
  wasmVersion: number;
  wasmLocation: string;
  energy: number;
  currentEvent: number;
  rootState: string;
  capacity: number;
}

export interface NucleusListResponse {
  success: boolean;
  data?: NucleusInfo[];
  message?: string;
} 