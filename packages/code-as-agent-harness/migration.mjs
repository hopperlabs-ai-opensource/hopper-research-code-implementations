export const sampleConfig = {
	version: 1,
	timeoutSeconds: 0,
	retries: 3,
	theme: "dark",
	projects: [
		{ id: "notes", timeoutSeconds: 2 },
		{ id: "tasks", timeoutSeconds: 5 },
	],
};
function checkInput(input) {
	if (
		!input ||
		typeof input !== "object" ||
		Array.isArray(input) ||
		input.version !== 1
	)
		throw Error("Expected a version 1 configuration.");
	const bounded = (x) => Number.isFinite(x) && x >= 0 && x <= 3600;
	if (
		!bounded(input.timeoutSeconds) ||
		!Number.isInteger(input.retries) ||
		input.retries < 0 ||
		input.retries > 10 ||
		!["light", "dark"].includes(input.theme)
	)
		throw Error("Invalid timeout, retries or theme.");
	if (
		!Array.isArray(input.projects) ||
		input.projects.length > 20 ||
		!input.projects.every(
			(p) =>
				p &&
				typeof p.id === "string" &&
				/^[a-z][a-z0-9-]{0,39}$/.test(p.id) &&
				bounded(p.timeoutSeconds),
		) ||
		new Set(input.projects.map((p) => p.id)).size !== input.projects.length
	)
		throw Error("Use up to 20 distinct projects with valid timeouts.");
	for (const key of Object.keys(input))
		if (
			!["version", "timeoutSeconds", "retries", "theme", "projects"].includes(
				key,
			)
		)
			throw Error("Unknown configuration key: " + key);
	for (const p of input.projects)
		for (const key of Object.keys(p))
			if (!["id", "timeoutSeconds"].includes(key))
				throw Error("Unknown project key: " + key);
}
export function migrateConfig(input) {
	checkInput(input);
	return {
		version: 2,
		timeoutMs: input.timeoutSeconds * 1000,
		retries: input.retries,
		theme: input.theme,
		projects: input.projects.map((p) => ({
			id: p.id,
			timeoutMs: p.timeoutSeconds * 1000,
		})),
	};
}
export function verifyMigration(before, after) {
	checkInput(before);
	return [
		{
			name: "Version and field names migrated",
			passed:
				after?.version === 2 &&
				Object.keys(after).sort().join(",") ===
					"projects,retries,theme,timeoutMs,version" &&
				Array.isArray(after.projects) &&
				after.projects.every(
					(p) => p && Object.keys(p).sort().join(",") === "id,timeoutMs",
				),
		},
		{
			name: "Every timeout preserves duration, including zero",
			passed:
				after?.timeoutMs === before.timeoutSeconds * 1000 &&
				Array.isArray(after.projects) &&
				before.projects.every(
					(p, i) => after.projects[i]?.timeoutMs === p.timeoutSeconds * 1000,
				),
		},
		{
			name: "Project identity, order and count preserved",
			passed:
				Array.isArray(after?.projects) &&
				after.projects.length === before.projects.length &&
				before.projects.every((p, i) => after.projects[i]?.id === p.id),
		},
		{
			name: "Unrelated settings preserved",
			passed:
				after?.theme === before.theme && after?.retries === before.retries,
		},
	];
}
export function compareMigration(input) {
	checkInput(input);
	const naive = {
		...input,
		version: 2,
		timeoutMs: (input.timeoutSeconds || 30) * 1000,
	};
	delete naive.timeoutSeconds;
	const migrated = migrateConfig(input);
	return {
		naive,
		naiveChecks: verifyMigration(input, naive),
		migrated,
		checks: verifyMigration(input, migrated),
	};
}
