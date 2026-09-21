import type { SupportReport } from "./support-workflow.mjs";
export interface SupportProgram {
  id: string;
  title: string;
  description: string;
  version: string;
  versionDigest: string;
  request: { model: string; state: unknown; questions: Record<string, unknown> };
}
export function localSupportClient(origin?: string): {
  connect(signal?: AbortSignal): Promise<SupportProgram>;
  evaluate(
    tickets: unknown,
    options?: { versionDigest?: string; signal?: AbortSignal },
  ): Promise<SupportReport>;
};
