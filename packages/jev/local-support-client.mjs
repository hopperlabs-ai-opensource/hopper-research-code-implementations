import {
  prepareSupportState,
  validateTickets,
  makeReport,
} from "./support-workflow.mjs";

export function localSupportClient(origin = "http://127.0.0.1:4418") {
  const url = new URL(origin);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error("Use an explicit loopback HTTP origin, such as http://127.0.0.1:4418.");
  const call = async (path, body, signal) => {
    const response = await fetch(url.origin + "/local-api/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "X-TypeSafe-Local": "1",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      redirect: "error",
      signal,
    });
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw Error("The configured local owner did not return JSON.");
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.byteLength;
      if (size > 2000000) throw Error("Local owner response exceeded the limit.");
      chunks.push(chunk);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!response.ok)
      throw Error("Local owner refused the request (" + response.status + ").");
    return data;
  };
  const connect = async (signal = AbortSignal.timeout(10000)) => {
    const data = await call("programs", undefined, signal),
      program = data.programs?.find((p) => p.id === "support/triage/v1");
    if (!program?.request?.questions || !/^[a-f0-9]{64}$/.test(program.versionDigest))
      throw Error("Support Triage v1 is not available from this local owner.");
    return program;
  };
  return {
    connect,
    async evaluate(
      tickets,
      { versionDigest, signal = AbortSignal.timeout(60000) } = {},
    ) {
      const inputs = validateTickets(tickets),
        program = await connect(signal),
        results = [];
      if (versionDigest && versionDigest !== program.versionDigest)
        throw Error(
          "The local program changed. Reconnect before running this version.",
        );
      for (const ticket of inputs) {
        signal.throwIfAborted();
        const id = crypto.randomUUID(),
          request = { ...program.request, state: prepareSupportState(ticket) };
        let run = await call("runs", { id, request, backend: "hopper" }, signal);
        while (run.status === "running") {
          await new Promise((resolve) => setTimeout(resolve, 60));
          signal.throwIfAborted();
          run = await call("runs/" + id, undefined, signal);
        }
        if (run.status !== "succeeded")
          throw Error(
            "The local evaluation did not succeed for " +
              ticket.id +
              ". Inspect owner history before retrying.",
          );
        const result = run.result,
          e = result?.evidence?.find((e) => e.kind === "saved-support-program"),
          a = result?.response?.answers;
        if (
          result?.backend !== "hopper" ||
          result?.response?.model !== "hopper-graph-local-v1" ||
          !e ||
          e.versionDigest !== program.versionDigest ||
          !a?.department ||
          !a?.urgency
        )
          throw Error(
            "Owner result does not match the connected local support program.",
          );
        results.push({
          id: ticket.id,
          department: a.department.choice,
          urgency: a.urgency.choice,
          issue: a.issue?.choice,
          tone: a.tone?.choice,
          observations: e.observations,
          decisions: e.decisions,
          instance: e.instance,
          programDigest: e.versionDigest,
        });
      }
      return makeReport(inputs, results, {
        source: "local-hopper-owner",
        programDigest: program.versionDigest,
        created: new Date().toISOString(),
        encoderRequired: false,
      });
    },
  };
}
