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
