import { generateFlux1Schnell } from './models/flux1Schnell';
import { generateFlux2Dev } from './models/flux2Dev';
import { generateSDXLLightning } from './models/sdxlLightning';
import { generatePhoenix } from './models/phoenix';
import { generateLucidOrigin } from './models/lucidOrigin';

const AVAILABLE_MODELS = ['flux-1-schnell', 'flux-2-dev', 'sdxl-lightning', 'phoenix-1.0', 'lucid-origin'] as const;
type ModelType = typeof AVAILABLE_MODELS[number];

interface Env {
  AI: Ai;
  ALLOWED_ORIGINS: string;
  TURNSTILE_SECRET_KEY: string;
}

export interface CaricatureRequest {
  prompt?: string;
  model?: ModelType;
  settings?: {
    style?: {
      type?: string;
      lighting?: string;
      mood?: string;
      details?: string;
    };
    subject?: {
      type?: string;
      hasReferencePhoto?: boolean;
      features?: {
        hair?: string;
        face?: {
          cheeks_exaggeration?: number;
          chin_exaggeration?: number;
          forehead_exaggeration?: number;
          nose_exaggeration?: number;
          ears_exaggeration?: number;
        };
        expression?: string;
      };
      clothing?: {
        outfit?: string;
        shirt?: string;
        tie?: string;
      };
    };
    background?: {
      type?: string;
      atmosphere?: string;
    };
    sectionsEnabled?: {
      hair?: boolean;
      face?: boolean;
      clothing?: boolean;
      style?: boolean;
    };
  };
  userPhoto?: string;
  extraMode?: boolean;
  width?: number;
  height?: number;
  steps?: number;
  turnstileToken?: string;
}

async function generateImage(ai: Ai, model: string, request: CaricatureRequest, prompt: string) {
  switch (model) {
    case 'flux-1-schnell':
      return generateFlux1Schnell(ai, request, prompt);
    case 'flux-2-dev':
      return generateFlux2Dev(ai, request, prompt);
    case 'sdxl-lightning':
      return generateSDXLLightning(ai, request, prompt);
    case 'phoenix-1.0':
      return generatePhoenix(ai, request, prompt);
    case 'lucid-origin':
      return generateLucidOrigin(ai, request, prompt);
    default:
      throw new Error(`Unknown model: ${model}`);
  }
}

async function validateTurnstile(
  token: string,
  secretKey: string,
  clientIP: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', clientIP);

    const result = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const outcome = await result.json() as {
      success: boolean;
      'error-codes'?: string[];
    };

    if (!outcome.success) {
      return {
        success: false,
        error: `Turnstile validation failed: ${outcome['error-codes']?.join(', ') || 'unknown'}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to validate Turnstile token',
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('origin') || '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());

    const clientIP = request.headers.get('CF-Connecting-IP') || '';
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('::ffff:127.');

    // validate origin
    const isOriginAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed === origin) return true;
      if (origin.includes('localhost') && allowed.includes('localhost')) return true;
      return false;
    });


    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      if (!isOriginAllowed) {
        return new Response('Origin not allowed', { status: 403 });
      }
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Reject requests from disallowed origins
    if (!isOriginAllowed) {
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }



    // Root endpoint: GET /
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Caricature Studio Worker is running',
        endpoints: {
          transform: 'POST /api/transform',
          health: 'GET /'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      });
    }

    // API endpoint: POST /api/transform
    if (url.pathname === '/api/transform' && request.method === 'POST') {
      try {
        const body = (await request.json()) as CaricatureRequest;

        // Turnstile validation - skip for localhost
        if (!isLocalhost) {
          const token = body.turnstileToken;

          if (!token) {
            return new Response(
              JSON.stringify({
                error: 'Missing Turnstile token',
                details: 'Please complete the verification challenge'
              }),
              {
                status: 401,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': origin,
                },
              }
            );
          }

          const validation = await validateTurnstile(token, env.TURNSTILE_SECRET_KEY, clientIP);

          if (!validation.success) {
            return new Response(
              JSON.stringify({
                error: 'Turnstile verification failed',
                details: validation.error
              }),
              {
                status: 401,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': origin,
                },
              }
            );
          }
        }

        // Build prompt from settings or use provided prompt
        let finalPrompt: string;

        if (body.settings) {
          // Build prompt from structured settings
          const s = body.settings;
          const parts: string[] = [];

          // Add base caricature type
          if (s.style?.type) parts.push(s.style.type);
          if (s.subject?.type) parts.push(`of a ${s.subject.type}`);

          // Add face features
          if (s.subject?.features?.face) {
            const face = s.subject.features.face;
            const exags: string[] = [];
            if (typeof face.cheeks_exaggeration === 'number' && face.cheeks_exaggeration > 50) exags.push('exaggerated cheeks');
            if (typeof face.chin_exaggeration === 'number' && face.chin_exaggeration > 50) exags.push('exaggerated chin');
            if (typeof face.forehead_exaggeration === 'number' && face.forehead_exaggeration > 50) exags.push('exaggerated forehead');
            if (typeof face.nose_exaggeration === 'number' && face.nose_exaggeration > 50) exags.push('exaggerated nose');
            if (typeof face.ears_exaggeration === 'number' && face.ears_exaggeration > 50) exags.push('exaggerated ears');
            if (exags.length > 0) parts.push(`with ${exags.join(', ')}`);
          }

          // Add expression
          if (s.subject?.features?.expression) parts.push(`${s.subject.features.expression} expression`);

          // Add hair
          if (s.subject?.features?.hair && s.subject.features.hair !== '(default)') {
            parts.push(`${s.subject.features.hair} hair`);
          }

          // Add clothing
          if (s.subject?.clothing && s.subject.clothing.outfit !== '(default)') {
            parts.push(`wearing ${s.subject.clothing.outfit}`);
          }

          // Add lighting
          if (s.style?.lighting && s.style.lighting !== '(default)') {
            parts.push(`with ${s.style.lighting}`);
          }

          // Add background
          if (s.background?.type && s.background.type !== '(default)') {
            parts.push(`against ${s.background.type}`);
          }

          // Add extra details
          if (body.extraMode && s.style?.details) {
            parts.push(s.style.details);
          }

          finalPrompt = parts.join(', ');
        } else if (body.prompt) {
          finalPrompt = body.prompt;
        } else {
          return new Response(
            JSON.stringify({ error: 'Missing prompt or settings field' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
              },
            }
          );
        }

        // Generate image using selected model (default: sdxl-lightning)
        const model = body.model || 'sdxl-lightning';
        let response;

        try {
          response = await generateImage(env.AI, model, body, finalPrompt);

          console.log(`[${model}] Response type:`, typeof response);
          console.log(`[${model}] Response keys:`, Object.keys(response || {}));
          console.log(`[${model}] Response preview:`, JSON.stringify(response).substring(0, 200));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes('Unknown model')) {
            return new Response(
              JSON.stringify({
                error: errorMsg,
                availableModels: AVAILABLE_MODELS,
              }),
              {
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': origin,
                },
              }
            );
          }
          throw error;
        }

        return new Response(JSON.stringify(response), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
          },
        });
      } catch (error) {
        console.error('Error generating caricature:', error);
        return new Response(
          JSON.stringify({
            error: 'Failed to generate caricature',
            details: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin,
            },
          }
        );
      }
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
