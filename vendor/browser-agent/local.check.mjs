import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { startLocalBridge, decodeTicket } from "./server.mjs";
async function ticket() {
	const s = createServer();
	await new Promise((r) => s.listen(0, "127.0.0.1", r));
	const port = s.address().port;
	await new Promise((r) => s.close(r));
	const t = {
		version: 1,
		origin: "https://hopperlabs.ai",
		sessionId: "test-session-12345",
		port,
		token: randomBytes(32).toString("hex"),
	};
	return { t, encoded: Buffer.from(JSON.stringify(t)).toString("base64url") };
}
test("exact-origin binding, bounded at-most-once delivery, readback and revocation", async () => {
	const { t, encoded } = await ticket();
	const b = await startLocalBridge(encoded, { timeoutMs: 1000 });
	const base = `http://127.0.0.1:${t.port}`;
	const headers = {
		Origin: t.origin,
		Authorization: `Bearer ${t.token}`,
		"Content-Type": "application/json",
	};
	try {
		assert.equal(
			(
				await fetch(base + "/poll", {
					headers: { ...headers, Origin: "https://wrong.example" },
				})
			).status,
			403,
		);
		assert.equal(
			(
				await fetch(base + "/poll", {
					headers: { ...headers, Authorization: "Bearer wrong" },
				})
			).status,
			403,
		);
		const options = await fetch(base + "/poll", {
			method: "OPTIONS",
			headers: { Origin: t.origin },
		});
		assert.equal(
			options.headers.get("access-control-allow-private-network"),
			"true",
		);
		await fetch(base + "/poll", { headers });
		assert.equal(b.status().connected, true);
		const pending = b.request("call_tool", { name: "inspect", arguments: {} });
		const command = (await (await fetch(base + "/poll", { headers })).json())
			.command;
		assert.equal(
			(await (await fetch(base + "/poll", { headers })).json()).command,
			null,
		);
		assert.equal(
			(
				await fetch(base + "/result", {
					method: "POST",
					headers,
					body: JSON.stringify({
						id: command.id,
						sessionId: "wrong",
						ok: true,
						result: {},
					}),
				})
			).status,
			409,
		);
		await fetch(base + "/result", {
			method: "POST",
			headers,
			body: JSON.stringify({
				id: command.id,
				sessionId: t.sessionId,
				ok: true,
				result: { value: 42 },
			}),
		});
		assert.deepEqual(await pending, { value: 42 });
		const waiting = b.request("inspect", {}).catch((e) => e.message);
		assert.match(await waiting, /Invalid/);
		await fetch(base + "/stop", { method: "POST", headers });
		assert.equal(b.status().revoked, true);
		await assert.rejects(b.request("describe"), /closed/);
	} finally {
		await b.close();
	}
});
test("invalid tickets fail before binding", () => {
	assert.throws(() => decodeTicket("not-json"));
	assert.throws(() =>
		decodeTicket(
			Buffer.from(JSON.stringify({ origin: "http://evil.example" })).toString(
				"base64url",
			),
		),
	);
});
