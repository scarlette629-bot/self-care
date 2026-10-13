import type { HealthRecord, Metric } from "./model";

export type LabStatus = "normal" | "high" | "low" | "critical" | "unknown";
export const labStatuses = {
  normal: { label: "正常", icon: "✓", color: "#207345" },
  high: { label: "偏高 H", icon: "↑", color: "#a85108" },
  low: { label: "偏低 L", icon: "↓", color: "#2468b5" },
  critical: { label: "危急值 Critical", icon: "!", color: "#c12f3d" },
  unknown: { label: "未判定", icon: "?", color: "#647078" },
} as const;

// Critical limits must be approved separately from report reference intervals.
// No approved policy has been supplied for this project; never infer one from
// the reference catalog, an unusually large value, or a general abnormal flag.
export type ReviewedCriticalPolicy = {
  metricId: string;
  unit: string;
  low?: number;
  high?: number;
  reviewedBy: string;
  reviewedAt: string;
  source: string;
};
const reviewedCriticalPolicies: readonly ReviewedCriticalPolicy[] = [];
export function labStatus(
  r: HealthRecord,
  m?: Metric,
  policies: readonly ReviewedCriticalPolicy[] = reviewedCriticalPolicies,
): LabStatus {
  if (!Number.isFinite(r.value)) return "unknown";
  const policy =
    m &&
    policies.find(
      (p) =>
        p.metricId === r.metricId &&
        p.unit === m.unit &&
        p.reviewedBy.trim() &&
        p.source.trim() &&
        Number.isFinite(Date.parse(p.reviewedAt)) &&
        (p.low === undefined || Number.isFinite(p.low)) &&
        (p.high === undefined || Number.isFinite(p.high)) &&
        (p.low === undefined || p.high === undefined || p.low < p.high),
    );
  if (
    policy &&
    ((policy.low !== undefined && r.value <= policy.low) ||
      (policy.high !== undefined && r.value >= policy.high))
  )
    return "critical";
  if (
    (r.low === undefined && r.high === undefined) ||
    (r.low !== undefined && !Number.isFinite(r.low)) ||
    (r.high !== undefined && !Number.isFinite(r.high)) ||
    (r.low !== undefined &&
      r.high !== undefined &&
      (r.low > r.high ||
        (r.low === r.high && (r.lowExclusive || r.highExclusive))))
  )
    return "unknown";
  if (
    r.low !== undefined &&
    (r.lowExclusive ? r.value <= r.low : r.value < r.low)
  )
    return "low";
  if (
    r.high !== undefined &&
    (r.highExclusive ? r.value >= r.high : r.value > r.high)
  )
    return "high";
  return "normal";
}
