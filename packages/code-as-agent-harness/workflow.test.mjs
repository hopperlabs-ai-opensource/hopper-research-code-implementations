import { test } from "node:test";
import assert from "node:assert/strict";
import {
	sampleTickets,
	releaseReport,
	verifyReport,
	parseTickets,
} from "./workflow.mjs";
test("release report excludes resolved latest updates, preserves reopened issues and evidence", () => {
	const r = releaseReport(sampleTickets);
	assert.deepEqual(
		r.report.map((x) => x.id),
		["APP-104", "APP-102", "APP-105"],
	);
	assert.equal(
		r.draftChecks.every((x) => x.passed),
		false,
	);
	assert.ok(r.checks.every((x) => x.passed));
	assert.equal(r.report[1].record, 2);
});
test("real input changes alter the report", () => {
	const r = releaseReport(
		sampleTickets + "\nAPP-102,Export fixed,resolved,P1,2026-09-18",
	);
	assert.deepEqual(
		r.report.map((x) => x.id),
		["APP-104", "APP-105"],
	);
	assert.deepEqual(
		releaseReport(sampleTickets, { priorities: ["P0"] }).report.map(
			(x) => x.id,
		),
		["APP-104"],
	);
});
test("quoted titles round-trip and ambiguous or invalid source records fail closed", () => {
	assert.equal(
		parseTickets(sampleTickets)[0].title,
		"Sign in fails, Safari only",
	);
	assert.throws(
		() =>
			releaseReport(
				sampleTickets + "\nAPP-104,Different state,closed,P0,2026-09-17",
			),
		/Conflicting/,
	);
	assert.throws(
		() => releaseReport(sampleTickets.replace("2026-09-14", "2026-02-31")),
		/date/,
	);
	assert.throws(
		() => releaseReport(sampleTickets.replace("open,P1", "unknown,P1")),
		/known status/,
	);
	assert.throws(
		() =>
			releaseReport(
				'id,title,status,priority,updated\nID,"bad,open,P1,2026-09-14',
			),
		/closed/,
	);
});

test("verification rejects altered content with a valid source record number", () => {
	const result = releaseReport(sampleTickets);
	const forged = result.report.map((row, i) =>
		i === 0 ? { ...row, title: "Invented title" } : row,
	);
	assert.equal(
		verifyReport(result.rows, forged, ["P0", "P1"])[1].passed,
		false,
	);
});
