/** Practical, bounded data workflow. No LLM is called by this local example. */
export const sampleTickets = `id,title,status,priority,updated
APP-101,"Sign in fails, Safari only",open,P1,2026-09-14
APP-102,Export drops the final row,open,P1,2026-09-15
APP-103,Help text typo,open,P3,2026-09-15
APP-101,"Sign in fails, Safari only",resolved,P1,2026-09-16
APP-104,Mobile save loses edits,reopened,P0,2026-09-17
APP-105,Keyboard focus disappears,in progress,P1,2026-09-17
APP-106,Settings panel spacing,closed,P2,2026-09-17`;
export function parseTickets(csv) {
	if (typeof csv !== "string" || csv.length > 100000)
		throw Error("Paste a CSV export smaller than 100 KB.");
	const records = [];
	let fields = [],
		field = "",
		quoted = false,
		endedQuote = false;
	for (let i = 0; i <= csv.length; i++) {
		const c = i === csv.length ? "\n" : csv[i];
		if (quoted) {
			if (c === '"') {
				if (csv[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					quoted = false;
					endedQuote = true;
				}
			} else field += c;
			continue;
		}
		if (endedQuote && c !== "," && c !== "\n" && c !== "\r")
			throw Error("Unexpected text after a quoted CSV field.");
		if (c === '"') {
			if (field) throw Error("Quote must start a CSV field.");
			quoted = true;
		} else if (c === "," || c === "\n") {
			fields.push(field);
			field = "";
			endedQuote = false;
			if (c === "\n") {
				if (fields.some((x) => x.trim())) records.push(fields);
				fields = [];
			}
		} else if (c !== "\r") field += c;
	}
	if (quoted) throw Error("A quoted CSV field was not closed.");
	if (records.length < 2 || records.length > 501)
		throw Error("Provide a header and 1–500 issue records.");
	if (records[0].join(",").toLowerCase() !== "id,title,status,priority,updated")
		throw Error("Columns must be id,title,status,priority,updated.");
	const rows = records.slice(1).map((values, i) => {
		if (values.length !== 5)
			throw Error(`Record ${i + 1}: expected five columns.`);
		const [id, title, rawStatus, rawPriority, updated] = values.map((x) =>
			x.trim(),
		);
		const status = rawStatus.toLowerCase().replaceAll(" ", "_"),
			priority = rawPriority.toUpperCase();
		if (!/^[\w-]{1,40}$/.test(id) || !title || title.length > 240)
			throw Error(`Record ${i + 1}: invalid ID or title.`);
		if (
			!["open", "in_progress", "reopened", "closed", "resolved"].includes(
				status,
			) ||
			!/^P[0-3]$/.test(priority)
		)
			throw Error(`Record ${i + 1}: use a known status and priority P0–P3.`);
		if (
			!/^\d{4}-\d{2}-\d{2}$/.test(updated) ||
			!Number.isFinite(Date.parse(updated)) ||
			new Date(updated).toISOString().slice(0, 10) !== updated
		)
			throw Error(`Record ${i + 1}: use a valid YYYY-MM-DD date.`);
		return { id, title, status, priority, updated, record: i + 1 };
	});
	return rows;
}
export function latestTickets(rows) {
	const latest = new Map();
	for (const row of rows) {
		const old = latest.get(row.id);
		if (
			old &&
			old.updated === row.updated &&
			(old.status !== row.status ||
				old.priority !== row.priority ||
				old.title !== row.title)
		)
			throw Error(
				`Conflicting records for ${row.id} on ${row.updated}. Resolve the conflict before publishing.`,
			);
		if (!old || old.updated < row.updated) latest.set(row.id, row);
	}
	return [...latest.values()];
}
export function verifyReport(rows, report, priorities) {
	const latest = latestTickets(rows),
		ids = report.map((row) => row.id);
	const checks = [
		{ name: "One entry per issue", passed: new Set(ids).size === ids.length },
		{
			name: "Every entry cites its latest source record",
			passed: report.every((item) =>
				latest.some((row) =>
					["id", "title", "status", "priority", "updated", "record"].every(
						(key) => row[key] === item[key],
					),
				),
			),
		},
		{
			name: "Only unresolved issues at the chosen priorities",
			passed: report.every(
				(item) =>
					!["resolved", "closed"].includes(item.status) &&
					priorities.includes(item.priority),
			),
		},
		{
			name: "No qualifying issue is missing",
			passed: latest.every(
				(row) =>
					["closed", "resolved"].includes(row.status) ||
					!priorities.includes(row.priority) ||
					ids.includes(row.id),
			),
		},
	];
	return checks;
}
export function releaseReport(csv, { priorities = ["P0", "P1"] } = {}) {
	if (
		!Array.isArray(priorities) ||
		!priorities.length ||
		priorities.some((p) => !/^P[0-3]$/.test(p)) ||
		new Set(priorities).size !== priorities.length
	)
		throw Error("Choose distinct priorities P0–P3.");
	const rows = parseTickets(csv),
		latest = latestTickets(rows);
	const draft = rows.filter((row) => priorities.includes(row.priority));
	const draftChecks = verifyReport(rows, draft, priorities);
	const report = latest
		.filter(
			(row) =>
				!["resolved", "closed"].includes(row.status) &&
				priorities.includes(row.priority),
		)
		.sort(
			(a, b) =>
				a.priority.localeCompare(b.priority) || a.id.localeCompare(b.id),
		);
	const checks = verifyReport(rows, report, priorities);
	if (!checks.every((check) => check.passed))
		throw Error("Report failed verification.");
	const trace = [
		{
			title: "Read the source",
			detail: `Parsed ${rows.length} records. Quoted titles and embedded commas stay intact.`,
			code: "const rows = parseTickets(csv);\n// Validate columns, dates, priorities and statuses.\n// Preserve each source record number.",
			artifact: rows,
		},
		{
			title: "Check a quick draft",
			detail:
				"Filtering by priority alone includes stale or resolved records. The same verifier checks this draft.",
			code: "const draft = rows.filter(row => priorities.includes(row.priority));\nverifyReport(rows, draft, priorities);",
			artifact: { draft, draftChecks },
		},
		{
			title: "Use current state",
			detail: `Keep the latest dated record for each issue: ${latest.length} distinct issues. Conflicting updates on the same date stop the run.`,
			code: "const latest = latestTickets(rows);\n// One current record per issue.\n// Conflicting same-day updates throw.",
			artifact: latest,
		},
		{
			title: "Build the report",
			detail: `Choose unresolved ${priorities.join(" / ")} issues. Each result retains its source-record number.`,
			code: "const report = latest.filter(row =>\n  !['resolved', 'closed'].includes(row.status) &&\n  priorities.includes(row.priority)\n);",
			artifact: report,
		},
		{
			title: "Verify before returning",
			detail:
				"Check identity, provenance, status and completeness. The result is returned only if all four checks pass.",
			code: "const checks = verifyReport(rows, report, priorities);\nif (!checks.every(check => check.passed)) {\n  throw Error('Report failed verification.');\n}\nreturn { report, checks };",
			artifact: checks,
		},
	];
	return { rows, latest, draft, draftChecks, report, checks, trace };
}
