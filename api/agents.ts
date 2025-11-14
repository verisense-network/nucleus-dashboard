const SENSESPACE_BACKEND_URL = process.env.NEXT_PUBLIC_SENSESPACE_BACKEND_URL || 'https://api.sensespace.xyz';

export interface Agent {
  nucleusId: string;
  name: string;
  description?: string;
  ownerId?: string;
  priceRate?: number;
  stripeAccountId?: string;
  chargesEnabled?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  lastFetchedAt?: string;
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
