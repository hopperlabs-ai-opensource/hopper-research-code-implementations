import { test } from "node:test";
import assert from "node:assert/strict";
import { runHarness, verify } from "./index.mjs";
test("failure is observed before a bounded repair restores zero", () => {
	const r = runHarness("3,0,2,3,-1");
	assert.equal(r.passed, true);
	assert.deepEqual(r.output, [-1, 0, 2, 3]);
	assert.ok(r.events.some((e) => e.detail.startsWith("FAIL")));
	assert.equal(r.events.filter((e) => e.phase === "Repair").length, 1);
});
test("exhausted budget cannot return a success", () => {
	const r = runHarness("0,1", { repairBudget: 0 });
	assert.equal(r.passed, false);
	assert.equal(r.events.at(-1).phase, "Stopped");
});
test("valid first candidate needs no repair", () => {
	const r = runHarness("2,-2,2", { injectBug: false });
	assert.deepEqual(r.output, [-2, 2]);
	assert.ok(!r.events.some((e) => e.phase === "Repair"));
});
test("independent verifier detects lost, added, duplicate and unsorted values", () => {
	for (const output of [[1], [0, 1, 2], [0, 0, 1], [1, 0]])
		assert.equal(verify([0, 1], output), false);
});
test("bad inputs and code are rejected", () => {
	for (const text of [
		"",
		"1,,2",
		"Infinity",
		"process.exit()",
		"1,".repeat(65),
	])
		assert.throws(() => runHarness(text));
	assert.throws(() => runHarness("1", { repairBudget: 2 }));
});
