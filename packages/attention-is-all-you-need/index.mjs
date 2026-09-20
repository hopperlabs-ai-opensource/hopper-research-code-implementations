/** Original educational implementation of Vaswani et al., section 3.2.
 * No learned parameters, training, tokenizer or benchmark reproduction. */
function matrix(value, name) {
	if (
		!Array.isArray(value) ||
		value.length < 1 ||
		value.length > 128 ||
		!Array.isArray(value[0]) ||
		value[0].length < 1 ||
		value[0].length > 128 ||
		value.some(
			(row) =>
				!Array.isArray(row) ||
				row.length !== value[0].length ||
				row.some((n) => !Number.isFinite(n) || Math.abs(n) > 1e6),
		)
	)
		throw new Error(
			`${name}: expected a finite rectangular matrix, at most 128 × 128`,
		);
}
export function attention(Q, K, V, { causal = false, temperature = 1 } = {}) {
	matrix(Q, "Q");
	matrix(K, "K");
	matrix(V, "V");
	if (Q[0].length !== K[0].length || K.length !== V.length)
		throw new Error("Q/K feature widths and K/V sequence lengths must match");
	if (causal && Q.length !== K.length)
		throw new Error("Causal self-attention needs equal lengths");
	if (!Number.isFinite(temperature) || temperature < 0.05 || temperature > 20)
		throw new Error("Temperature must be between 0.05 and 20");
	const scores = Q.map((q, i) =>
		K.map((k, j) =>
			causal && j > i
				? -Infinity
				: q.reduce((sum, x, d) => sum + x * k[d], 0) /
					Math.sqrt(q.length) /
					temperature,
		),
	);
	const weights = scores.map((row) => {
		const max = Math.max(...row);
		const exps = row.map((x) => Math.exp(x - max));
		const sum = exps.reduce((a, b) => a + b, 0);
		return exps.map((x) => x / sum);
	});
	const output = weights.map((row) =>
		V[0].map((_, d) =>
			row.reduce((sum, weight, j) => sum + weight * V[j][d], 0),
		),
	);
	return { scores, weights, output };
}
export function multiHeadAttention(heads, options = {}) {
	if (!Array.isArray(heads) || !heads.length || heads.length > 16)
		throw new Error("Expected 1–16 projected heads");
	const results = heads.map(({ Q, K, V }) => attention(Q, K, V, options));
	if (results.some((r) => r.output.length !== results[0].output.length))
		throw new Error("Head query lengths differ");
	// The caller supplies projected Q/K/V. A learned output projection is not included.
	return {
		heads: results,
		concatenated: results[0].output.map((_, i) =>
			results.flatMap((r) => r.output[i]),
		),
	};
}
export function positionalEncoding(length, width) {
	if (
		!Number.isInteger(length) ||
		length < 1 ||
		length > 128 ||
		!Number.isInteger(width) ||
		width < 2 ||
		width > 128 ||
		width % 2
	)
		throw new Error("Expected length 1–128 and even width 2–128");
	return Array.from({ length }, (_, pos) =>
		Array.from({ length: width }, (_, d) =>
			d % 2
				? Math.cos(pos / 10000 ** ((d - 1) / width))
				: Math.sin(pos / 10000 ** (d / width)),
		),
	);
}
