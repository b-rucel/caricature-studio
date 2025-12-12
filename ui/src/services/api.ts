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
const API_KEY = import.meta.env.VITE_API_KEY;

export async function generateCaricature(
  request: GenerateCaricatureRequest
): Promise<GenerateCaricatureResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if available (for localhost/dev)
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/transform`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
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
