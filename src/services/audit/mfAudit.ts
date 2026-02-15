/**
 * DrMindsetFit — MF Audit SSOT
 * Single contract for trace + warnings across engines.
 */
export type MFWarn = { code: string; message: string; severity?: "info" | "warn" | "danger" };

export type MFAudit<TTrace extends Record<string, unknown> = Record<string, unknown>> = {
  version: string;                 // audit schema version
  trace: TTrace;                   // deterministic trace
  warnings: MFWarn[];              // guardrails + engine warnings
};

export const MF_AUDIT_VERSION = "1.0.0";

export function mfAudit<TTrace extends Record<string, unknown>>(trace: TTrace, warnings: MFWarn[] = []): MFAudit<TTrace> {
  return { version: MF_AUDIT_VERSION, trace, warnings };
}
