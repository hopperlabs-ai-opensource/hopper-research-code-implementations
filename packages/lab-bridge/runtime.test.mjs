import { test } from "node:test";
import assert from "node:assert/strict";
import { installLabBridge } from "./runtime.mjs";
import { labContracts, validateLabInput } from "./contracts.mjs";
test("bridge rejects other frames, wrong nonces, invalid schemas and executable actions", () => {
	let listener;
	let calls = 0;
	const replies = [];
	const parent = { postMessage: (reply) => replies.push(reply) };
	const host = {
		addEventListener: (_, fn) => (listener = fn),
		removeEventListener: () => (listener = null),
	};
	const channel = "12345678-1234-1234-1234-123456789012";
	const cleanup = installLabBridge({
		host,
		parent,
		channel,
		schema: labContracts["harness-migration"],
		inspect: () => ({ value: ++calls }),
		run: () => ({ value: ++calls }),
		reset: () => ({ value: ++calls }),
	});
	const send = (patch = {}, source = parent) =>
		listener({
			source,
			data: {
				type: "hopper-research-request",
				channel,
				id: "one",
				action: "inspect",
				...patch,
			},
		});
	send({}, {});
	send({ channel: "wrong" });
	assert.equal(calls, 0);
	send();
	send();
	assert.equal(calls, 1);
	assert.deepEqual(replies[0], replies[1]);
	send({ action: "reset" });
	assert.equal(calls, 1);
	assert.match(replies.at(-1).error, /different input/);
	send({ id: "two", action: "run", input: { config: { version: 2 } } });
	assert.equal(calls, 1);
	assert.equal(replies.at(-1).ok, false);
	send({ id: "three", action: "eval" });
	assert.match(replies.at(-1).error, /Unknown/);
	cleanup();
	assert.equal(listener, null);
});
test("advertised schemas reject nonfinite, oversized and unexpected data", () => {
	assert.throws(() =>
		validateLabInput(labContracts["attention-recipes"], {
			data: { features: [], query: [], unit: "days", records: [] },
			temperature: 1,
		}),
	);
	assert.throws(() =>
		validateLabInput(labContracts["code-as-agent-harness"], {
			csv: "x".repeat(20001),
			priorities: ["P0"],
		}),
	);
	assert.throws(() =>
		validateLabInput(labContracts["harness-migration"], {
			config: {
				version: 1,
				timeoutSeconds: Infinity,
				retries: 1,
				theme: "dark",
				projects: [],
			},
		}),
	);
});
