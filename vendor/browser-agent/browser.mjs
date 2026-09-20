/** Dependency-free page end of the local connector. Call only after a user chooses Connect. */
export function createConnectionTicket(origin, sessionId) {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	const ticket = {
		version: 1,
		origin,
		sessionId,
		port: 48000 + (crypto.getRandomValues(new Uint16Array(1))[0] % 12000),
		token: [...bytes].map((n) => n.toString(16).padStart(2, "0")).join(""),
	};
	return {
		ticket,
		encoded: btoa(JSON.stringify(ticket))
			.replaceAll("+", "-")
			.replaceAll("/", "_")
			.replace(/=+$/, ""),
	};
}
export function connectLocalPage({ ticket, describe, tools, execute, status }) {
	const controller = new AbortController();
	let stopped = false,
		connected = false;
	const started = Date.now();
	const endpoint = `http://127.0.0.1:${ticket.port}`;
	const request = (path, body) =>
		fetch(endpoint + path, {
			method: body ? "POST" : "GET",
			headers: {
				Authorization: `Bearer ${ticket.token}`,
				...(body ? { "Content-Type": "application/json" } : {}),
			},
			body: body ? JSON.stringify(body) : undefined,
			signal: controller.signal,
			cache: "no-store",
		});
	const pause = () =>
		new Promise((resolve) => {
			const done = () => {
				clearTimeout(timer);
				controller.signal.removeEventListener("abort", done);
				resolve();
			};
			const timer = setTimeout(done, 700);
			controller.signal.addEventListener("abort", done, { once: true });
		});
	const work = async () => {
		while (!stopped) {
			try {
				const response = await request("/poll");
				if (response.status === 410) throw Error("REVOKED");
				if (!response.ok) throw Error("Connection rejected");
				const data = await response.json();
				if (data.sessionId !== ticket.sessionId) throw Error("REVOKED");
				connected = true;
				status("Local connector connected");
				if (data.command) {
					const c = data.command;
					let result,
						ok = true,
						error;
					try {
						if (c.kind === "describe") result = describe();
						else if (c.kind === "list_tools") result = tools();
						else if (c.kind === "call_tool")
							result = await execute(c.input.name, c.input.arguments);
						else throw Error("Unknown operation");
					} catch (e) {
						ok = false;
						error = String(e.message ?? e).slice(0, 500);
					}
					if (!stopped)
						await request("/result", {
							id: c.id,
							sessionId: ticket.sessionId,
							ok,
							result,
							error,
						});
				}
			} catch (error) {
				if (stopped) break;
				if (
					connected ||
					error.message === "REVOKED" ||
					Date.now() - started > 180000
				) {
					status(
						"Disconnected. Reconnect explicitly; inspect before retrying any edit.",
					);
					stopped = true;
					break;
				}
				status(
					"Waiting for the local command. Allow local network access if your browser asks.",
				);
			}
			await pause();
		}
	};
	void work();
	return () => {
		stopped = true;
		controller.abort();
		void fetch(endpoint + "/stop", {
			method: "POST",
			headers: { Authorization: `Bearer ${ticket.token}` },
			keepalive: true,
		}).catch(() => {});
	};
}
