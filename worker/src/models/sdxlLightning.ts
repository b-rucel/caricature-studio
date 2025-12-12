import { streamToBase64 } from '../utils/streamToBase64';
import type { CaricatureRequest } from '../index';

export async function generateSDXLLightning(ai: Ai, request: CaricatureRequest, prompt: string) {
	const steps = Math.min(request.steps || 4, 20);
	const params: any = {
		prompt,
		width: request.width || 1024,
		height: request.height || 1024,
		num_steps: steps,
	};

	// Add img2img support if userPhoto is provided
	if (request.userPhoto) {
		// Extract base64 data from data URI if needed
		const imageData = request.userPhoto.includes('base64,')
			? request.userPhoto.split('base64,')[1]
			: request.userPhoto;
		params.image_b64 = imageData;
		params.strength = 0.8; // Default strength for caricature transformation
	}

	const response = await ai.run('@cf/bytedance/stable-diffusion-xl-lightning', params);

	// SDXL-Lightning returns a ReadableStream with PNG binary data
	const base64Image = await streamToBase64(response as ReadableStream<Uint8Array>);
	return { image: `data:image/png;base64,${base64Image}` };
}
