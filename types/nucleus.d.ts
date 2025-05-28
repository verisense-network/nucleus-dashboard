export interface NucleusInfo {
  id: string;
  name: string;
  manager: string;
  wasm_hash: string;
  wasm_version: number;
  wasm_location: string;
  energy: number;
  current_event: number;
  root_state: string;
  capacity: number;
}

export interface NucleusListResponse {
  success: boolean;
  data?: NucleusInfo[];
  message?: string;
} 