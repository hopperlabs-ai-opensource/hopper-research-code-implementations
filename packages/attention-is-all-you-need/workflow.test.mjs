import { test } from "node:test";
import assert from "node:assert/strict";
import {
	trainLookup,
	lookupDelivery,
	deliverySample,
	people,
	days,
} from "./workflow.mjs";
const model = trainLookup();
test("training lowers cross-entropy on identity matching", () => {
	assert.ok(model.history.at(-1).loss < 0.02);
	assert.ok(model.history[0].loss > 1);
	assert.deepEqual(trainLookup(), model);
});
test("held-out schedules, permutations and values are answered through context", () => {
	let checked = 0;
	for (let shift = 0; shift < 6; shift++)
		for (let offset = 0; offset < 5; offset++) {
			const records = people.map((_, i) => ({
				person: people[(i + shift) % 6],
				day: days[(i + offset) % 5],
			}));
			for (const row of records) {
				const result = lookupDelivery(model, records, row.person);
				assert.equal(result.answer, row.day);
				assert.ok(result.weights[records.indexOf(row)] > 0.95);
				checked++;
			}
		}
	assert.equal(checked, 180);
});
test("editing a date changes the answer, equal weighting loses the binding", () => {
	assert.equal(lookupDelivery(model, deliverySample, "Mira").answer, "Tuesday");
	assert.equal(
		lookupDelivery(
			model,
			deliverySample.map((r) =>
				r.person === "Mira" ? { ...r, day: "Thursday" } : r,
			),
			"Mira",
		).answer,
		"Thursday",
	);
	assert.equal(
		lookupDelivery(model, deliverySample, "Mira", { uniform: true }).answer,
		"No single answer",
	);
});
test("missing or conflicting records are not silently answered", () => {
	assert.throws(
		() => lookupDelivery(model, deliverySample, "Omar"),
		/needs a record/,
	);
	assert.throws(
		() => lookupDelivery(model, [...deliverySample, deliverySample[0]], "Mira"),
		/distinct/,
	);
	assert.throws(() => trainLookup({ epochs: 10000 }));
});
