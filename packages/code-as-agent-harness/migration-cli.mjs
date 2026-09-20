import { readFile, stat } from "node:fs/promises";
import { sampleConfig, compareMigration } from "./migration.mjs";
try {
	const file = process.argv[2];
	if (file && (await stat(file)).size > 10000)
		throw Error("Configuration must be at most 10 KB.");
	const input = file ? JSON.parse(await readFile(file, "utf8")) : sampleConfig;
	console.log(JSON.stringify(compareMigration(input), null, 2));
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
