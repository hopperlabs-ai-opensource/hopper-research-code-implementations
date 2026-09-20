import { readFile } from "node:fs/promises";
import { releaseReport, sampleTickets } from "./workflow.mjs";
try {
	const result = releaseReport(
		process.argv[2] ? await readFile(process.argv[2], "utf8") : sampleTickets,
	);
	console.log(
		JSON.stringify({ report: result.report, checks: result.checks }, null, 2),
	);
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
