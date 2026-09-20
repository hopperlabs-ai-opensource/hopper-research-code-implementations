import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
await mkdir("dist", { recursive: true });
await build({
	entryPoints: ["server.mjs", "cli.mjs"],
	outdir: "dist",
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node22",
	outExtension: { ".js": ".mjs" },
	banner: {
		js: 'import { createRequire as _createRequire } from "node:module"; const require = _createRequire(import.meta.url);',
	},
});
