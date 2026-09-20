#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import {
	examples,
	runLab,
	sampleInput,
	researchTools,
} from "../packages/interfaces/runtime.mjs";
import {
	serveMcp,
	startLocalBridge,
	browserTools,
} from "../vendor/browser-agent/dist/server.mjs";
const [command, ...args] = process.argv.slice(2);
const version = JSON.parse(
	await readFile(new URL("../package.json", import.meta.url), "utf8"),
).version;
try {
	if (command === "mcp") {
		const binding = args.includes("--bind")
			? await startLocalBridge(args[args.indexOf("--bind") + 1])
			: null;
		const server = await serveMcp({
			name: "hopper-research",
			version,
			tools: [...researchTools(), ...(binding ? browserTools(binding) : [])],
			resources: [
				{
					uri: "research://examples",
					name: "Runnable examples",
					mimeType: "application/json",
					read: examples,
				},
				{
					uri: "research://catalog",
					name: "Research explanations and sources",
					mimeType: "application/json",
					read: async () =>
						JSON.parse(
							await readFile(
								new URL("../packages/interfaces/catalog.json", import.meta.url),
								"utf8",
							),
						),
				},
			],
		});
		const close = async () => {
			await binding?.close();
			await server.close();
			process.exit(0);
		};
		process.once("SIGINT", close);
		process.once("SIGTERM", close);
		process.stdin.once("end", close);
	} else if (command === "list")
		console.log(JSON.stringify(examples(), null, 2));
	else if (command === "run") {
		const id = args[0];
		const file = args.includes("--input")
			? args[args.indexOf("--input") + 1]
			: null;
		if (!file && !args.includes("--sample"))
			throw Error("Use run <example> --sample or --input <JSON file>");
		const bytes = file ? await readFile(file, "utf8") : null;
		if (bytes && bytes.length > 65536) throw Error("Input exceeds 64 KB");
		console.log(
			JSON.stringify(
				runLab(id, bytes ? JSON.parse(bytes) : sampleInput(id)),
				null,
				2,
			),
		);
	} else if (command === "doctor") {
		const passed = examples().map((e) => ({
			id: e.id,
			passed: !!runLab(e.id, e.sample).output,
		}));
		console.log(
			JSON.stringify(
				{
					version,
					node: process.versions.node,
					supported: Number(process.versions.node.split(".")[0]) >= 22,
					examples: passed,
					network: "none for calculations",
					mcp: "Use npm run check to verify protocol and CLI parity",
				},
				null,
				2,
			),
		);
	} else if (command === "serve") await import("./serve.mjs");
	else
		console.log(
			"hopper-research list\nhopper-research run <example> --sample | --input file.json\nhopper-research mcp [--bind <page-ticket>]\nhopper-research serve\nhopper-research doctor",
		);
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
