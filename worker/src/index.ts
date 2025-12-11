interface Env {
	AI: Ai;
	ALLOWED_ORIGINS: string;
	API_KEY?: string;
}

interface CaricatureRequest {
	prompt?: string;
	model?: 'flux-1-schnell' | 'sdxl-lightning';
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
}

// Helper to convert stream to base64
async function streamToBase64(stream: ReadableStream<Uint8Array>): Promise<string> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	// Combine chunks into single buffer
	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
	const buffer = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.length;
	}

	// Convert to base64
	let binary = '';
	for (let i = 0; i < buffer.byteLength; i++) {
		binary += String.fromCharCode(buffer[i]);
	}
	return btoa(binary);
}

// Model-specific handlers
async function generateFlux1Schnell(ai: Ai, request: CaricatureRequest, prompt: string) {
	const steps = Math.min(request.steps || 4, 8);
	const response = await ai.run('@cf/black-forest-labs/flux-1-schnell', {
		prompt,
		steps,
	});

	// FLUX-1 returns JSON with base64 image
	if (response && typeof response === 'object' && 'image' in response) {
		const imageData = (response as any).image;
		return { image: `data:image/jpeg;base64,${imageData}` };
	}

	return response;
}

async function generateSDXLLightning(ai: Ai, request: CaricatureRequest, prompt: string) {
	const steps = Math.min(request.steps || 4, 20);
	const response = await ai.run('@cf/bytedance/stable-diffusion-xl-lightning', {
		prompt,
		width: request.width || 1024,
		height: request.height || 1024,
		num_steps: steps,
	});

	// SDXL-Lightning returns a ReadableStream with PNG binary data
	const base64Image = await streamToBase64(response as ReadableStream<Uint8Array>);
	return { image: `data:image/png;base64,${base64Image}` };
}

async function generateImage(ai: Ai, model: string, request: CaricatureRequest, prompt: string) {
	switch (model) {
		case 'flux-1-schnell':
			return generateFlux1Schnell(ai, request, prompt);
		case 'sdxl-lightning':
			return generateSDXLLightning(ai, request, prompt);
		default:
			throw new Error(`Unknown model: ${model}`);
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const origin = request.headers.get('origin') || '';
		const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());

		// Validate origin
		const isOriginAllowed = allowedOrigins.some(allowed => {
			// Exact match or wildcard
			if (allowed === '*') return true;
			if (allowed === origin) return true;
			// Check if it's a localhost request
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
					health: 'GET /health'
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
				// Check API key if Bearer token is provided
				const authHeader = request.headers.get('Authorization') || '';
				const providedKey = authHeader.replace('Bearer ', '');

				// If Bearer token is provided, validate it
				if (authHeader && providedKey) {
					if (!env.API_KEY) {
						return new Response(
							JSON.stringify({ error: 'Unauthorized: API key not configured' }),
							{
								status: 401,
								headers: {
									'Content-Type': 'application/json',
									'Access-Control-Allow-Origin': origin,
								},
							}
						);
					}
					if (providedKey !== env.API_KEY) {
						return new Response(
							JSON.stringify({ error: 'Unauthorized: Invalid API key' }),
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

				const body = (await request.json()) as CaricatureRequest;

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
								availableModels: ['flux-1-schnell', 'sdxl-lightning'],
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

		// Health check endpoint
		if (url.pathname === '/health') {
			return new Response(JSON.stringify({ status: 'ok' }), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': origin,
				},
			});
		}

		return new Response('Not found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
