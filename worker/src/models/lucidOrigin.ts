import type { CaricatureRequest } from '../index';

export async function generateLucidOrigin(ai: Ai, request: CaricatureRequest, prompt: string) {
	const steps = Math.min(request.steps || 4, 40);
	const response = await ai.run('@cf/leonardo/lucid-origin', {
		prompt,
		width: request.width || 1024,
		height: request.height || 1024,
		steps,
		guidance: 4.5,
	});

	// Lucid Origin returns JSON with base64 image
	if (response && typeof response === 'object' && 'image' in response) {
		const imageData = (response as any).image;
		return { image: `data:image/jpeg;base64,${imageData}` };
	}

	return response;
}
