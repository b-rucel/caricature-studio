export async function streamToBase64(stream: ReadableStream<Uint8Array>): Promise<string> {
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
