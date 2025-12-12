import type { CaricatureRequest } from '../index';

export async function generateFlux2Dev(ai: Ai, request: CaricatureRequest, prompt: string) {
	const steps = Math.min(request.steps || 4, 8);

	// FLUX-2 requires multipart form data
	const formData = new FormData();
	formData.append('prompt', prompt);
	formData.append('width', String(request.width || 1024));
	formData.append('height', String(request.height || 1024));
	formData.append('steps', String(steps));

	// Create a request to extract multipart body and content-type
	const formRequest = new Request('http://dummy', {
		method: 'POST',
		body: formData
	});
	const formStream = formRequest.body;
	const formContentType = formRequest.headers.get('content-type') || 'multipart/form-data';

	const response = await ai.run('@cf/black-forest-labs/flux-2-dev', {
		multipart: {
			body: formStream,
			contentType: formContentType
		}
	});

	// FLUX-2 returns JSON with base64 image
	if (response && typeof response === 'object' && 'image' in response) {
		const imageData = (response as any).image;
		return { image: `data:image/jpeg;base64,${imageData}` };
	}

	return response;
}
