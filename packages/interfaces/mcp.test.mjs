import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { examples, runLab, sampleInput } from "./runtime.mjs";
test("MCP handshake, catalog, all five computations and CLI parity in a real child process", async () => {
	const child = spawn(process.execPath, ["scripts/cli.mjs", "mcp"], {
		stdio: ["pipe", "pipe", "pipe"],
	});
	const pending = new Map();
	let seq = 0;
	let stderr = "";
	child.stderr.on("data", (c) => (stderr += c));
	const lines = createInterface({ input: child.stdout });
	lines.on("line", (line) => {
		const m = JSON.parse(line);
		const p = pending.get(m.id);
		if (p) {
			clearTimeout(p.timer);
			pending.delete(m.id);
			m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result);
		}
	});
	const call = (method, params) =>
		new Promise((resolve, reject) => {
			const id = ++seq;
			const timer = setTimeout(
				() => reject(Error("MCP timed out " + method + " " + stderr)),
				8000,
			);
			pending.set(id, { resolve, reject, timer });
			child.stdin.write(
				JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n",
			);
		});
	try {
		const init = await call("initialize", {
			protocolVersion: "2025-11-25",
			capabilities: {},
			clientInfo: { name: "qualification", version: "1" },
		});
		assert.equal(init.serverInfo.name, "hopper-research");
		child.stdin.write(
			JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) +
				"\n",
		);
		const listed = await call("tools/list", {});
		assert.equal(listed.tools.length, 6);
		for (const e of examples()) {
			const expected = runLab(e.id, e.sample);
			const actual = await call("tools/call", {
				name: "research_" + e.id.replaceAll("-", "_"),
				arguments: e.sample,
			});
			assert.equal(actual.isError, undefined);
			assert.deepEqual(actual.structuredContent.result, expected);
			const cli = JSON.parse(
				execFileSync(
					process.execPath,
					["scripts/cli.mjs", "run", e.id, "--sample"],
					{ encoding: "utf8" },
				),
			);
			assert.deepEqual(cli, expected);
		}
		const catalog = await call("resources/read", { uri: "research://catalog" });
		assert.equal(JSON.parse(catalog.contents[0].text).entries.length, 3);
		const bad = await call("tools/call", {
			name: "research_jev",
			arguments: { ...sampleInput("jev"), threshold: 2 },
		});
		assert.equal(bad.isError, true);
	} finally {
		for (const p of pending.values()) clearTimeout(p.timer);
		lines.close();
		child.kill();
	}
});
test("calls do not retain changed input or leak one run into the next", () => {
	const a = sampleInput("attention-is-all-you-need");
	a.records[0].day = "Friday";
	assert.equal(runLab("attention-is-all-you-need", a).output.answer, "Friday");
	assert.equal(
		runLab(
			"attention-is-all-you-need",
			sampleInput("attention-is-all-you-need"),
		).output.answer,
		"Tuesday",
	);
});
