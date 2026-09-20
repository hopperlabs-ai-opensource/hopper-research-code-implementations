import { attention } from "./index.mjs";

/** Hand-authored features make the mechanics visible. No embeddings or training. */
export const recipes = [
  {
    title: "Find a useful help article",
    question: "Which article fits this support request?",
    features: ["Sign-in", "Billing", "Export"],
    query: [1, 0, 0],
    unit: "minutes to read",
    records: [
      { label: "Reset a password", key: [1, 0, 0], value: 3 },
      { label: "Update a payment method", key: [0, 1, 0], value: 5 },
      { label: "Download an invoice", key: [0, 0.8, 0.7], value: 4 },
      { label: "Export your workspace", key: [0, 0, 1], value: 8 },
    ],
    try: "Turn Sign-in down and Export up. Then add Billing: an article that covers both topics becomes more relevant.",
    adapt: "Replace the articles with your own records and choose a few explicit features. For exact categories, start with a filter. This example is useful when a request can overlap several topics.",
  },
  {
    title: "Blend estimates from past work",
    question: "What do related projects suggest about effort?",
    features: ["Interface", "Data", "Integration"],
    query: [0, 1, 1],
    unit: "illustrative days",
    records: [
      { label: "Settings page", key: [1, 0, 0], value: 2 },
      { label: "Import cleanup", key: [0, 1, 0.2], value: 5 },
      { label: "Partner sync", key: [0.1, 0.7, 1], value: 12 },
      { label: "Reporting dashboard", key: [0.8, 1, 0.1], value: 7 },
    ],
    try: "Change the request from data + integration to interface work. Raise the temperature to spread weight across more projects.",
    adapt: "Replace the fictional projects with comparable completed work. Keep values in one unit. Compare against a simple average on held-out work before trusting estimates; these weights are not uncertainty bounds.",
  },
];

export function runRecipe(data, { temperature = 0.25 } = {}) {
  const label = (s) => typeof s === "string" && s.trim().length > 0 && s.length <= 80;
  if (!data || !Array.isArray(data.features) || data.features.length < 1 || data.features.length > 8 ||
      !Array.from(data.features).every(label) || new Set(data.features).size !== data.features.length)
    throw Error("Use 1–8 distinct feature names, each at most 80 characters.");
  const vector = (v) => Array.isArray(v) && v.length === data.features.length &&
    Array.from(v).every((x) => Number.isFinite(x) && x >= 0 && x <= 1);
  if (!vector(data.query)) throw Error("Query features must be numbers between 0 and 1.");
  if (!Array.isArray(data.records) || data.records.length < 1 || data.records.length > 12 ||
      !Array.from(data.records).every((r) => r && label(r.label) && vector(r.key) && Number.isFinite(r.value) && r.value >= 0 && r.value <= 10000) ||
      new Set(data.records.map((r) => r.label)).size !== data.records.length)
    throw Error("Use 1–12 distinct records with labels, feature vectors from 0 to 1, and numeric values from 0 to 10,000.");
  if (!label(data.unit)) throw Error("Give the values a unit, such as minutes or days.");
  const result = attention([data.query], data.records.map((r) => r.key), data.records.map((r) => [r.value]), { temperature });
  const strongest = Math.max(...result.weights[0]);
  const matches = data.records.filter((_, i) => Math.abs(result.weights[0][i] - strongest) < 1e-10);
  return {
    match: matches.length === 1 ? matches[0].label : "No single match",
    noSignal: result.scores[0].every((score) => score === 0),
    output: result.output[0][0],
    rows: data.records.map((r, i) => ({ ...r, score: result.scores[0][i], weight: result.weights[0][i], contribution: result.weights[0][i] * r.value })),
  };
}
