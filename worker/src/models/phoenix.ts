import { streamToBase64 } from '../utils/streamToBase64';
import type { CaricatureRequest } from '../index';

export async function generatePhoenix(ai: Ai, request: CaricatureRequest, prompt: string) {
	const steps = Math.min(request.steps || 25, 50);
	const response = await ai.run('@cf/leonardo/phoenix-1.0', {
		prompt,
		width: request.width || 1024,
		height: request.height || 1024,
		num_steps: steps,
		guidance: 2, // Default guidance value
	});

	// Phoenix returns a ReadableStream with image binary data
	const base64Image = await streamToBase64(response as ReadableStream<Uint8Array>);
	return { image: `data:image/jpeg;base64,${base64Image}` };
}
