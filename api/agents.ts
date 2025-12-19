const SENSESPACE_BACKEND_URL = process.env.NEXT_PUBLIC_SENSESPACE_BACKEND_URL || 'https://api.sensespace.xyz';

export type AgentAuditStatus = 'NoAudit' | 'Auditing' | 'Accepted' | 'Rejected';

export interface Agent {
  nucleusId: string;
  name: string;
  description?: string;
  ownerId?: string;
  priceRate?: number;
  stripeAccountId?: string;
  auditStatus?: AgentAuditStatus;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  lastFetchedAt?: string;
}

export interface AgentAuditInfo {
  onboardComplete: boolean;
  auditStatus: AgentAuditStatus;
}

export interface AgentWithCategories {
  agent: Agent;
  categories: Array<{
    category: string;
    subcategory?: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function getAgentById(nucleusId: string): Promise<ApiResponse<Agent>> {
  try {
    const response = await fetch(
      `${SENSESPACE_BACKEND_URL}/api/agents?nucleus_id=${encodeURIComponent(nucleusId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to fetch agent',
      };
    }

    const data = await response.json();
    return {
      success: data.success,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error('Error fetching agent:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch agent',
    };
  }
}

export async function getAgentAuditStatus(nucleusId: string): Promise<ApiResponse<AgentAuditInfo>> {
  try {
    const response = await fetch(
      `${SENSESPACE_BACKEND_URL}/api/agents/agent-status/${encodeURIComponent(nucleusId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to fetch agent audit status',
      };
    }

    const data = await response.json();
    return {
      success: data.success,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error('Error fetching agent audit status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch agent audit status',
    };
  }
}

/**
 * Request agent audit - requires wallet signature verification
 * Note: Backend needs to be modified to accept wallet signature instead of JWT
 * Similar to onboardAgent implementation
 */
export async function requestAgentAudit(
  nucleusId: string,
  signature: string
): Promise<ApiResponse<string>> {
  try {
    const response = await fetch(
      `${SENSESPACE_BACKEND_URL}/api/agents/audit/${encodeURIComponent(nucleusId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: nucleusId,
          signature,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to request agent audit',
      };
    }

    const data = await response.json();
    return {
      success: data.success,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error('Error requesting agent audit:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to request agent audit',
    };
  }
}
