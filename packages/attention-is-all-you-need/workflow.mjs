import { attention } from "./index.mjs";
/** A trained attention head over structured records, not a full language model. */
export const people = ["Mira", "Noah", "Lena", "Omar", "Eva", "Jules"];
export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const deliverySample = [
	{ person: "Mira", day: "Tuesday" },
	{ person: "Noah", day: "Friday" },
	{ person: "Lena", day: "Monday" },
];
function randomGenerator(seed) {
	let state = seed;
	return () => {
		state = (1664525 * state + 1013904223) >>> 0;
		return state / 4294967296;
	};
}
function modelWeights(seed) {
	const random = randomGenerator(seed);
	return Array.from({ length: people.length }, () =>
		Array.from({ length: 8 }, () => random() - 0.5),
	);
}
export function trainLookup({ epochs = 800, seed = 42 } = {}) {
	if (
		!Number.isInteger(epochs) ||
		epochs < 0 ||
		epochs > 2000 ||
		!Number.isInteger(seed)
	)
		throw Error("Expected 0–2000 epochs and an integer seed.");
	const Q = modelWeights(seed),
		K = modelWeights(seed + 1),
		scale = Math.sqrt(8),
		learningRate = 0.4,
		history = [];
	for (let epoch = 0; epoch <= epochs; epoch++) {
		const qGrad = Q.map((row) => row.map(() => 0)),
			kGrad = K.map((row) => row.map(() => 0));
		let loss = 0;
		for (let i = 0; i < people.length; i++) {
			const scores = K.map(
				(k) => k.reduce((sum, value, d) => sum + Q[i][d] * value, 0) / scale,
			);
			const max = Math.max(...scores),
				exps = scores.map((x) => Math.exp(x - max)),
				sum = exps.reduce((a, b) => a + b, 0),
				weights = exps.map((x) => x / sum);
			loss -= Math.log(weights[i]);
			for (let j = 0; j < people.length; j++) {
				const grad = (weights[j] - (i === j ? 1 : 0)) / people.length;
				for (let d = 0; d < 8; d++) {
					qGrad[i][d] += (grad * K[j][d]) / scale;
					kGrad[j][d] += (grad * Q[i][d]) / scale;
				}
			}
		}
		if (epoch % 100 === 0 || epoch === epochs)
			history.push({ epoch, loss: loss / people.length });
		if (epoch === epochs) break;
		for (let i = 0; i < people.length; i++)
			for (let d = 0; d < 8; d++) {
				Q[i][d] -= learningRate * qGrad[i][d];
				K[i][d] -= learningRate * kGrad[i][d];
			}
	}
	return { Q, K, history, epochs, seed };
}
export function lookupDelivery(
	model,
	records,
	person,
	{ uniform = false } = {},
) {
	if (
		!Array.isArray(records) ||
		records.length < 1 ||
		records.length > 6 ||
		new Set(records.map((x) => x.person)).size !== records.length
	)
		throw Error("Use 1–6 records with distinct names.");
	if (
		records.some(
			(row) => !people.includes(row.person) || !days.includes(row.day),
		)
	)
		throw Error(
			"This small model supports only the displayed names and weekdays.",
		);
	if (!people.includes(person) || !records.some((row) => row.person === person))
		throw Error("The requested person needs a record.");
	if (
		typeof uniform !== "boolean" ||
		!model ||
		!Array.isArray(model.Q) ||
		!Array.isArray(model.K)
	)
		throw Error("Invalid model or attention mode.");
	const learnedQuery = model.Q[people.indexOf(person)],
		query = uniform ? learnedQuery.map(() => 0) : learnedQuery,
		keys = records.map((row) => model.K[people.indexOf(row.person)]);
	const values = records.map((row) =>
		days.map((day) => (row.day === day ? 1 : 0)),
	);
	const result = attention(
		[query],
		keys,
		values,
	);
	const probabilities = result.output[0],
		best = Math.max(...probabilities),
		answers = days.filter((_, i) => Math.abs(probabilities[i] - best) < 1e-10);
	return {
		answer: answers.length === 1 ? answers[0] : "No single answer",
		probabilities,
		weights: result.weights[0],
		scores: result.scores[0],
		query,
		keys,
		values,
	};
}
