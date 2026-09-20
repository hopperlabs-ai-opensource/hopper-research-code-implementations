import { requestFor, validateAnswers } from "./index.mjs";
/** Node-only example; deliberately never included in the browser artifact. */
export async function evaluateJev(
	state,
	{ apiKey, model = "jev-latest", fetchImpl = fetch } = {},
) {
	if (typeof apiKey !== "string" || !apiKey.trim() || /[\r\n]/.test(apiKey))
		throw Error("A TypeSafe API key is required.");
	const response = await fetchImpl("https://api.typesafe.ai/v1/systemone", {
		method: "POST",
		redirect: "error",
		signal: AbortSignal.timeout(20000),
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(requestFor(state, model)),
	});
	if (!response.ok)
		throw Error(`TypeSafe request failed (HTTP ${response.status}).`);
	const reader = response.body?.getReader();
	if (!reader) throw Error("Missing response body.");
	let size = 0;
	const parts = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > 65536) {
			await reader.cancel();
			throw Error("TypeSafe response exceeds 64 KB.");
		}
		parts.push(value);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const part of parts) {
		bytes.set(part, offset);
		offset += part.length;
	}
	const body = JSON.parse(new TextDecoder().decode(bytes));
	validateAnswers(body.answers);
	return { model: body.model, answers: body.answers };
}
