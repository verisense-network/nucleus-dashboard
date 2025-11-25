const SENSESPACE_BACKEND_URL = process.env.NEXT_PUBLIC_SENSESPACE_BACKEND_URL || 'https://api.sensespace.xyz';

export interface OnboardAgentRequest {
  agentId: string;
  signature: string;
}

export interface OnboardAgentResponse {
  stripeOnboardingUrl: string;
  apiKey: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function onboardAgent(
  request: OnboardAgentRequest,
  country: string
): Promise<ApiResponse<OnboardAgentResponse>> {
  try {
    const response = await fetch(`${SENSESPACE_BACKEND_URL}/v1/payment/onboard?country=${country}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    // Backend always returns 200 with { success, data?, message? }
    if (!data.success) {
      return {
        success: false,
        message: data.message || 'Failed to onboard agent',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error onboarding agent:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
