import { readFile, lstat } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { scenarios, compareRouting, routeAnswers } from "./index.mjs";
import { evaluateJev } from "./client.mjs";
try {
	const args = process.argv.slice(2);
	if (args[0] === "--live") {
		if (args.length !== 2)
			throw Error("Usage: node packages/jev/cli.mjs --live ticket.txt");
		const file = process.env.TYPESAFE_API_KEY_FILE;
		if (!file || !isAbsolute(file))
			throw Error(
				"Set TYPESAFE_API_KEY_FILE to an absolute private key-file path.",
			);
		const stat = await lstat(file);
		if (
			!stat.isFile() ||
			stat.isSymbolicLink() ||
			stat.mode & 0o077 ||
			stat.size > 4096
		)
			throw Error(
				"Key file must be a private regular file (chmod 600), at most 4 KB.",
			);
		const inputStat = await lstat(args[1]);
		if (!inputStat.isFile() || inputStat.size > 32000)
			throw Error("Ticket must be a regular file at most 32 KB.");
		const state = await readFile(args[1], "utf8");
		const apiKey = (await readFile(file, "utf8")).trim();
		const response = await evaluateJev(state, {
			apiKey,
			model: process.env.TYPESAFE_MODEL || "jev-latest",
		});
		console.log(
			JSON.stringify(
				{
					mode: "live-api",
					...response,
					decision: routeAnswers(response.answers),
				},
				null,
				2,
			),
		);
	} else {
		const scenario = scenarios.find((x) => x.id === (args[0] || "mixed"));
		if (!scenario)
			throw Error(
				"Choose invoice, negation or mixed; --live ticket.txt uses the real API.",
			);
		console.log(
			JSON.stringify(
				{
					mode: "authored-fixture-not-model-output",
					state: scenario.state,
					comparison: compareRouting(scenario.state, scenario.answers),
				},
				null,
				2,
			),
		);
	}
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
