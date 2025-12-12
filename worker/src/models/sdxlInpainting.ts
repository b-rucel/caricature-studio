import { streamToBase64 } from '../utils/streamToBase64';
import type { CaricatureRequest } from '../index';

export async function generateSDXLInpainting(ai: Ai, request: CaricatureRequest, prompt: string) {
	const steps = Math.min(request.steps || 4, 20);
	const response = await ai.run('@cf/runwayml/stable-diffusion-v1-5-inpainting', {
		prompt,
		width: request.width || 1024,
		height: request.height || 1024,
		num_steps: steps,
		guidance: 7.5,
	});

	// Inpainting returns a ReadableStream with PNG binary data
	const base64Image = await streamToBase64(response as ReadableStream<Uint8Array>);
	return { image: `data:image/png;base64,${base64Image}` };
}
