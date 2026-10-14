export type AuditSeverity = "CRÍTICO" | "ADVERTENCIA" | "OK";

export type AuditFinding = {
  engine: string;
  severity: AuditSeverity;
  rule_name: string;
  node_name: string;
  node_type: string;
  message: string;
  recommendation: string;
};

export type AuditMetrics = {
  workflow_name: string;
  total_nodes: number;
  total_connections: number;
  critical_count: number;
  warning_count: number;
  pass_count: number;
};

export type AuditResult = {
  engine_version: string;
  metrics: AuditMetrics;
  findings: AuditFinding[];
};

export function isAuditResult(input: unknown): input is AuditResult {
  if (input === null || typeof input !== "object") return false;
  const candidate = input as Record<string, unknown>;
  const m = candidate.metrics as Record<string, unknown> | undefined;
  return (
    typeof candidate.engine_version === "string" &&
    Array.isArray(candidate.findings) &&
    m !== undefined &&
    typeof m === "object" &&
    typeof m.workflow_name === "string" &&
    typeof m.total_nodes === "number" &&
    typeof m.total_connections === "number" &&
    typeof m.critical_count === "number" &&
    typeof m.warning_count === "number" &&
    typeof m.pass_count === "number"
  );
}
