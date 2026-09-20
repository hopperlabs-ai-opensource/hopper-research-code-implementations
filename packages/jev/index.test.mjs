import { test } from "node:test";
import assert from "node:assert/strict";
import {
	scenarios,
	compareRouting,
	routeAnswers,
	requestFor,
	parseStructuredAnswer,
} from "./index.mjs";
import { evaluateJev } from "./client.mjs";
test("rules and the two answer paths are compared on identical authored cases", () => {
	const s = scenarios[1],
		result = compareRouting(s.state, s.answers);
	assert.equal(result.rules.route, "technical");
	assert.equal(result.typed.route, "billing");
	assert.deepEqual(result.structured, result.typed);
});
test("uncertainty threshold changes routing without changing model answer", () => {
	const s = scenarios[2];
	assert.equal(routeAnswers(s.answers).route, "review");
	assert.equal(routeAnswers(s.answers, { threshold: 0.2 }).route, "technical");
	assert.equal(routeAnswers(s.answers).urgent, true);
	assert.equal(s.answers.department.confidence, 0.24);
});
test("malformed values and unknown choices cannot produce decisions", () => {
	assert.throws(() => parseStructuredAnswer("prose instead of JSON"));
	for (const patch of [
		{ choice: "admin" },
		{ confidence: NaN },
		{ probabilities: { billing: 1, technical: 1, sales: 1 } },
	])
		assert.throws(() =>
			routeAnswers({
				...scenarios[0].answers,
				department: { ...scenarios[0].answers.department, ...patch },
			}),
		);
	assert.throws(() =>
		routeAnswers(scenarios[0].answers, { threshold: Infinity }),
	);
	assert.throws(() => requestFor(""));
});
test("documented API request and typed response are exercised through a stub", async () => {
	let sent;
	const result = await evaluateJev("Need an invoice", {
		apiKey: "test-fixture-key",
		fetchImpl: async (url, options) => {
			sent = { url, options };
			return new Response(
				JSON.stringify({ model: "fixture", answers: scenarios[0].answers }),
			);
		},
	});
	assert.equal(sent.url, "https://api.typesafe.ai/v1/systemone");
	assert.equal(
		JSON.parse(sent.options.body).questions.department.type,
		"choice",
	);
	assert.equal(result.answers.department.choice, "billing");
	assert.equal(sent.options.redirect, "error");
});
test("API failures, oversized responses and malformed answers fail closed", async () => {
	await assert.rejects(
		evaluateJev("a", {
			apiKey: "test",
			fetchImpl: async () => new Response("secret response", { status: 401 }),
		}),
		/HTTP 401/,
	);
	await assert.rejects(
		evaluateJev("a", {
			apiKey: "test",
			fetchImpl: async () => new Response("x".repeat(65537)),
		}),
		/64 KB/,
	);
	await assert.rejects(
		evaluateJev("a", {
			apiKey: "test",
			fetchImpl: async () => new Response('{"answers":{}}'),
		}),
		/Invalid/,
	);
});
