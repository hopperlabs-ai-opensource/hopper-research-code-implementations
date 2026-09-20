import { validateLabInput } from "./contracts.mjs";
/** Only the containing page with this instance's nonce can call fixed lab methods. */
export function installLabBridge({
	host,
	parent,
	channel,
	schema,
	inspect,
	run,
	reset,
}) {
	if (!/^[a-f0-9-]{36}$/.test(channel ?? "")) return () => {};
	const seen = new Map();
	const receive = (event) => {
		const m = event.data;
		if (
			event.source !== parent ||
			!m ||
			m.type !== "hopper-research-request" ||
			m.channel !== channel
		)
			return;
		if (typeof m.id !== "string" || !m.id || m.id.length > 80) return;
		const reply = (result) =>
			parent.postMessage(
				{ type: "hopper-research-response", channel, id: m.id, ...result },
				"*",
			);
		try {
			const fingerprint = JSON.stringify([m.action, m.input]);
			if (fingerprint.length > 40000) throw Error("Request exceeds lab limit");
			if (seen.has(m.id)) {
				const previous = seen.get(m.id);
				if (previous.fingerprint !== fingerprint)
					throw Error("Request ID already used with different input");
				reply(previous.result);
				return;
			}
			let value;
			if (m.action === "inspect") value = inspect();
			else if (m.action === "run") {
				validateLabInput(schema, m.input);
				value = run(m.input);
			} else if (m.action === "reset") value = reset();
			else throw Error("Unknown lab action");
			if (JSON.stringify(value).length > 262144)
				throw Error("Result exceeds lab limit");
			const result = { ok: true, result: value };
			seen.set(m.id, { fingerprint, result });
			if (seen.size > 64) seen.delete(seen.keys().next().value);
			reply(result);
		} catch (error) {
			reply({ ok: false, error: error.message });
		}
	};
	host.addEventListener("message", receive);
	return () => host.removeEventListener("message", receive);
}
