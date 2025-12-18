import type { ModelType } from '../constants'

export interface GenerateCaricatureRequest {
  settings?: any;
  userPhoto?: string;
  extraMode?: boolean;
  model?: ModelType;
  width?: number;
  height?: number;
  steps?: number;
}

export interface GenerateCaricatureResponse {
  image?: string;
  error?: string;
  details?: string;
}

// Use environment variable or fallback to localhost for dev
const API_BASE_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

export async function generateCaricature(
  request: GenerateCaricatureRequest,
  turnstileToken: string | null
): Promise<GenerateCaricatureResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${API_BASE_URL}/api/transform`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...request,
        turnstileToken: turnstileToken || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate caricature'
    );
  }
}
