import type { CaricatureRequest } from '../index';

export async function generateFlux1Schnell(ai: Ai, request: CaricatureRequest, prompt: string) {
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
