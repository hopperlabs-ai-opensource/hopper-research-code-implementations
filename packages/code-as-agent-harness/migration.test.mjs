import { test } from "node:test";
import assert from "node:assert/strict";
import {
	sampleConfig,
	compareMigration,
	verifyMigration,
	migrateConfig,
} from "./migration.mjs";
test("configuration migration preserves zero and nested values without mutation", () => {
	const input = structuredClone(sampleConfig),
		result = compareMigration(input);
	assert.equal(result.migrated.timeoutMs, 0);
	assert.deepEqual(input, sampleConfig);
	assert.equal(result.migrated.projects[0].timeoutMs, 2000);
	assert.ok(result.checks.every((x) => x.passed));
	assert.ok(result.naiveChecks.some((x) => !x.passed));
});
test("verifier catches lost projects, changed settings and wrong units", () => {
	for (const patch of [
		{ projects: [] },
		{ theme: "light" },
		{ timeoutMs: 30 },
		{ rogue: true },
	])
		assert.ok(
			verifyMigration(sampleConfig, {
				...migrateConfig(sampleConfig),
				...patch,
			}).some((x) => !x.passed),
		);
});
test("invalid version, unsupported keys and duplicate IDs fail closed", () => {
	for (const patch of [
		{ version: 2 },
		{ timeoutSeconds: -1 },
		{ unknown: 1 },
		{
			projects: [
				{ id: "a", timeoutSeconds: 1 },
				{ id: "a", timeoutSeconds: 1 },
			],
		},
	])
		assert.throws(() => migrateConfig({ ...sampleConfig, ...patch }));
});
