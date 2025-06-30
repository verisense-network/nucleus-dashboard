import { APIResponse } from "@/types/api";

export async function wrapApiRequest(request: () => Promise<any>, apiRequest: () => Promise<any>, isLocalNode: boolean): Promise<APIResponse<any>> {
  const response = isLocalNode ? await apiRequest() : await request();
  return isLocalNode ? {
    success: true,
    data: response,
  } : response;
}