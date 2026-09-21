#!/usr/bin/env node
// Hopper support starter — original MIT-licensed source. Node 22+.
// Edit prepareSupportState, keep evaluation labels separate, compare frozen cases.
// Reusable evaluation data and arithmetic. No classifier, credentials or network.
export const departments = ["billing", "technical", "sales", "needs_review"];
export const urgencies = ["routine", "elevated", "urgent", "needs_review"];
export const factNames = [
  "billing",
  "technical",
  "sales",
  "currentOutage",
  "blocked",
  "deadline",
  "resolved",
  "negativeEmotion",
  "strongEmotion",
  "polite",
  "duplicateCharge",
  "refund",
  "access",
  "pricing",
];
export const sampleTickets = [
  {
    id: "invoice",
    message: "Please send our invoice.",
    expected: { department: "billing", urgency: "routine" },
  },
  {
    id: "incident",
    message: "Our production service is down. Please help.",
    expected: { department: "technical", urgency: "urgent" },
  },
  {
    id: "quoted-example",
    message: 'Your documentation says "the service is down". Please send our invoice.',
    expected: { department: "billing", urgency: "routine" },
  },
  {
    id: "mixed",
    message: "Please review this invoice and pricing quote.",
    expected: { department: "needs_review", urgency: "needs_review" },
  },
];
const object = (value) => value && typeof value === "object" && !Array.isArray(value);
const only = (value, keys) =>
  object(value) && Object.keys(value).every((key) => keys.includes(key));
const text = (value, max) =>
  typeof value === "string" && value.length > 0 && value.length <= max;
export function validateTickets(value) {
  if (!Array.isArray(value) || !value.length || value.length > 20)
    throw Error("Use 1–20 tickets.");
  const seen = new Set();
  return value.map((ticket) => {
    if (
      !only(ticket, ["id", "message", "facts", "expected"]) ||
      !text(ticket.id, 64) ||
      seen.has(ticket.id) ||
      !text(ticket.message, 4000)
    )
      throw Error("Each ticket needs a unique id and a message of 1–4000 characters.");
    seen.add(ticket.id);
    if (
      ticket.facts !== undefined &&
      (!only(ticket.facts, factNames) ||
        Object.values(ticket.facts).some((v) => typeof v !== "boolean"))
    )
      throw Error("Facts must be named support facts with boolean values.");
    if (
      !only(ticket.expected, ["department", "urgency"]) ||
      !departments.includes(ticket.expected.department) ||
      !urgencies.includes(ticket.expected.urgency)
    )
      throw Error("Each ticket needs expected department and urgency labels.");
    return {
      id: ticket.id,
      message: ticket.message,
      facts: Object.fromEntries(
        Object.entries(ticket.facts ?? {}).sort(([a], [b]) => a.localeCompare(b)),
      ),
      expected: {
        department: ticket.expected.department,
        urgency: ticket.expected.urgency,
      },
    };
  });
}
// This is the adaptation entry point. Add business-specific observation mapping
// here in your fork; keep expected labels out of the request sent to the engine.
export function prepareSupportState(ticket) {
  return {
    schema: "hopper.support-triage/v1",
    message: ticket.message,
    facts: ticket.facts ?? {},
  };
}
export function makeReport(tickets, results, provenance = {}) {
  const inputs = validateTickets(tickets);
  if (!Array.isArray(results) || results.length !== inputs.length)
    throw Error("The report must contain one result per ticket.");
  const rows = inputs.map((ticket, i) => {
    const result = results[i];
    if (
      !object(result) ||
      result.id !== ticket.id ||
      !departments.includes(result.department) ||
      !urgencies.includes(result.urgency)
    )
      throw Error("Result IDs and supported labels must match the input tickets.");
    const correct =
      result.department === ticket.expected.department &&
      result.urgency === ticket.expected.urgency;
    return {
      ...result,
      correct,
      review: result.department === "needs_review" || result.urgency === "needs_review",
    };
  });
  return {
    schema: "hopper.research.support-evaluation/v1",
    tickets: inputs,
    results: rows,
    provenance,
    metrics: {
      total: rows.length,
      correct: rows.filter((r) => r.correct).length,
      mistakes: rows.filter((r) => !r.correct).length,
      review: rows.filter((r) => r.review).length,
    },
    scope:
      "Agreement with supplied labels on this dataset; not a production accuracy estimate.",
  };
}
export function readReport(value) {
  if (
    !object(value) ||
    value.schema !== "hopper.research.support-evaluation/v1" ||
    JSON.stringify(value).length > 500000
  )
    throw Error("Unsupported or oversized evaluation report.");
  return makeReport(
    value.tickets,
    value.results,
    object(value.provenance) ? value.provenance : {},
  );
}
export function compareReports(baseline, candidate) {
  const before = readReport(baseline),
    after = readReport(candidate);
  if (JSON.stringify(before.tickets) !== JSON.stringify(after.tickets))
    throw Error(
      "Comparison requires the exact same tickets, order, facts and expected labels.",
    );
  return {
    baseline: before.metrics,
    candidate: after.metrics,
    improvements: after.results
      .filter((r, i) => r.correct && !before.results[i].correct)
      .map((r) => r.id),
    regressions: after.results
      .filter((r, i) => !r.correct && before.results[i].correct)
      .map((r) => r.id),
    changed: after.results
      .filter(
        (r, i) =>
          r.department !== before.results[i].department ||
          r.urgency !== before.results[i].urgency,
      )
      .map((r) => r.id),
  };
}


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

import {readFileSync,writeFileSync,existsSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export async function supportMain(args=process.argv.slice(2)) {
  const option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
  if(args.includes('--sample'))return sampleTickets;
  else if(args.includes('--compare')){
    const i=args.indexOf('--compare');
    return compareReports(readReport(JSON.parse(readFileSync(args[i+1],'utf8'))),readReport(JSON.parse(readFileSync(args[i+2],'utf8'))));
  }else if(option('--input')&&option('--output')){
    if(existsSync(option('--output')))throw Error('Output already exists. Choose a new filename to preserve the baseline.');
    const tickets=JSON.parse(readFileSync(option('--input'),'utf8'));
    const report=await localSupportClient(option('--origin')).evaluate(tickets);
    report.provenance.adapterSha256=createHash('sha256').update(readFileSync(fileURLToPath(new URL(import.meta.url)))).digest('hex');
    writeFileSync(option('--output'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    return {file:option('--output'),metrics:report.metrics};
  }else throw Error('Use --sample, --input tickets.json --output new-report.json [--origin http://127.0.0.1:4418], or --compare baseline.json candidate.json.');
}
if(process.argv[1]&&realpathSync(process.argv[1])===realpathSync(import.meta.filename)){
  try{process.stdout.write(JSON.stringify(await supportMain(),null,2)+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
