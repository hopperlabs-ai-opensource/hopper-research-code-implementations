import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const names = ["attention-is-all-you-need", "code-as-agent-harness"];
await mkdir("dist", { recursive: true });
const hash = (s) => createHash("sha256").update(s).digest("base64");
const manifest = {
	schema: "hopper.research.examples.v1",
	version: JSON.parse(await readFile("package.json", "utf8")).version,
	license: "MIT",
	files: [],
};
for (const name of names) {
	const css = await readFile("scripts/demo.css", "utf8");
	const core = (
		await readFile(`packages/${name}/index.mjs`, "utf8")
	).replaceAll("export function", "function");
	const workflow = (await readFile(`packages/${name}/workflow.mjs`, "utf8"))
		.replace(/^import .*;\n/gm, "")
		.replaceAll("export function", "function")
		.replaceAll("export const", "const");
	const resize =
		"\nnew ResizeObserver(()=>parent.postMessage({type:'hopper-research-height',height:Math.ceil(document.body.getBoundingClientRect().height)},'*')).observe(document.body);";
	const js =
		core +
		"\n" +
		workflow +
		"\n" +
		(await readFile(`packages/${name}/demo.mjs`, "utf8")) +
		resize;
	const body = await readFile(`packages/${name}/demo.html`, "utf8");
	const csp = `default-src 'none'; script-src 'sha256-${hash(js)}'; style-src 'sha256-${hash(css)}'; base-uri 'none'; form-action 'none'`;
	const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>${name} · Hopper research</title><style>${css}</style></head><body>${body}<script>${js}</script></body></html>`;
	const file = name + ".html";
	await writeFile("dist/" + file, html);
	manifest.files.push({
		file,
		sha256: createHash("sha256").update(html).digest("hex"),
		bytes: Buffer.byteLength(html),
		csp,
	});
}
await writeFile("dist/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest, null, 2));
