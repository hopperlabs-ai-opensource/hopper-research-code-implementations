import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { labContracts } from "../packages/lab-bridge/contracts.mjs";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { Script } from "node:vm";

const attention = "packages/attention-is-all-you-need";
const harness = "packages/code-as-agent-harness";
const pages = [
	{
		name: "index",
		title: "Small, runnable ideas",
		body: "scripts/index.html",
		sources: [],
	},
	{
		name: "attention-is-all-you-need",
		title: "Find a changing fact",
		body: `${attention}/demo.html`,
		sources: [
			`${attention}/index.mjs`,
			`${attention}/workflow.mjs`,
			`${attention}/demo.mjs`,
		],
	},
	{
		name: "attention-recipes",
		title: "Give attention a job",
		body: `${attention}/recipes-demo.html`,
		sources: [
			`${attention}/index.mjs`,
			`${attention}/recipes.mjs`,
			`${attention}/recipes-demo.mjs`,
		],
	},
	{
		name: "code-as-agent-harness",
		title: "Build a verified report",
		body: `${harness}/demo.html`,
		sources: [
			`${harness}/index.mjs`,
			`${harness}/workflow.mjs`,
			`${harness}/demo.mjs`,
		],
	},
	{
		name: "harness-migration",
		title: "Check a migration",
		body: `${harness}/migration-demo.html`,
		sources: [`${harness}/migration.mjs`, `${harness}/migration-demo.mjs`],
	},
	{
		name: "jev",
		title: "Route a request",
		body: "packages/jev/demo.html",
		sources: ["packages/jev/index.mjs", "packages/jev/demo.mjs"],
	},
];
await mkdir("dist", { recursive: true });
const hash = (s) => createHash("sha256").update(s).digest("base64");
const css = await readFile("scripts/demo.css", "utf8");
const manifest = {
	schema: "hopper.research.examples.v1",
	version: JSON.parse(await readFile("package.json", "utf8")).version,
	license: "MIT",
	files: [],
};
for (const page of pages) {
	// Only our explicit source list is bundled; no user code is interpreted.
	const parts = [];
	for (const path of page.sources) {
		parts.push(
			(await readFile(path, "utf8"))
				.replace(/^import\s[\s\S]*?;\r?\n/gm, "")
				.replaceAll("export function", "function")
				.replaceAll("export const", "const"),
		);
	}
	if (labContracts[page.name]) {
		parts.push(
			(await readFile("packages/lab-bridge/contracts.mjs", "utf8"))
				.split("export function validateLabInput")[1]
				.replace(/^/, "function validateLabInput"),
		);
		parts.push(
			(await readFile("packages/lab-bridge/runtime.mjs", "utf8"))
				.replace(/^import\s[\s\S]*?;\r?\n/gm, "")
				.replace("export function", "function"),
		);
		parts.push(
			`installLabBridge({host:window,parent,channel:window.name.startsWith('hopper-research:')?window.name.slice(16):new URLSearchParams(location.search).get('channel'),schema:${JSON.stringify(labContracts[page.name])},inspect:labInspect,run:labRun,reset:labReset});`,
		);
	}
	parts.push(
		"\nif(new URLSearchParams(location.search).get('mode')==='playground')document.body.classList.add('playground');\nif(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embedded');\nnew ResizeObserver(()=>parent.postMessage({type:'hopper-research-height',height:Math.ceil(document.body.getBoundingClientRect().height)},'*')).observe(document.body);",
	);
	const js = parts.join("\n");
	new Script(js, { filename: page.name }); // Catch unsupported bundle syntax during check.
	const body = await readFile(page.body, "utf8");
	const nav = `<nav class="site-nav" aria-label="Experiments"><a class="brand" href="index.html">Hopper / Research</a><div>${pages.map((p, i) => `<a href="${p.name}.html"${p.name === page.name ? ' aria-current="page"' : ""}>${["Start here", "Learn attention", "Use attention", "Verify a report", "Check a migration", "Typed decisions"][i]}</a>`).join("")}</div></nav>`;
	const csp = `default-src 'none'; script-src 'sha256-${hash(js)}'; style-src 'sha256-${hash(css)}'; base-uri 'none'; form-action 'none'`;
	const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>${page.title} · Hopper research</title><style>${css}</style></head><body>${nav}${body}<script>${js}</script></body></html>`;
	if (Buffer.byteLength(html) > 128 * 1024 || gzipSync(html).length > 24 * 1024)
		throw Error(`Research artifact budget exceeded: ${page.name}`);
	const file = page.name + ".html";
	await writeFile("dist/" + file, html);
	manifest.files.push({
		file,
		sha256: createHash("sha256").update(html).digest("hex"),
		bytes: Buffer.byteLength(html),
		gzipBytes: gzipSync(html).length,
		brotliBytes: brotliCompressSync(html).length,
		...(labContracts[page.name]
			? { inputSchema: labContracts[page.name] }
			: {}),
		csp,
	});
}
await writeFile("dist/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest, null, 2));
