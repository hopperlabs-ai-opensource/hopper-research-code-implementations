export interface SupportTicket {
  id: string;
  message: string;
  facts?: Record<string, boolean>;
  expected: { department: string; urgency: string };
}
export interface SupportResult {
  id: string;
  department: string;
  urgency: string;
  issue?: string;
  tone?: string;
  observations?: {
    fact: string;
    value: boolean;
    source: string;
    matches: string[];
    excluded?: { match: string; reason: string }[];
  }[];
  decisions?: Record<string, { value: string; reason: string }>;
  instance?: string;
  programDigest?: string;
  correct?: boolean;
  review?: boolean;
}
export interface SupportReport {
  schema: "hopper.research.support-evaluation/v1";
  tickets: SupportTicket[];
  results: SupportResult[];
  provenance: Record<string, unknown>;
  metrics: { total: number; correct: number; mistakes: number; review: number };
  scope: string;
}
export const departments: string[];
export const urgencies: string[];
export const factNames: string[];
export const sampleTickets: SupportTicket[];
export function validateTickets(value: unknown): SupportTicket[];
export function prepareSupportState(ticket: SupportTicket): {
  schema: string;
  message: string;
  facts: Record<string, boolean>;
};
export function makeReport(
  tickets: unknown,
  results: unknown,
  provenance?: Record<string, unknown>,
): SupportReport;
export function readReport(value: unknown): SupportReport;
export function compareReports(
  baseline: unknown,
  candidate: unknown,
): {
  baseline: SupportReport["metrics"];
  candidate: SupportReport["metrics"];
  improvements: string[];
  regressions: string[];
  changed: string[];
};
