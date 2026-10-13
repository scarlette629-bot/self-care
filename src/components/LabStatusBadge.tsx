import type { HealthRecord, Metric } from "../lib/model";
import { labStatus, labStatuses } from "../lib/labStatus";
export function LabStatusBadge({
  record,
  metric,
}: {
  record: HealthRecord;
  metric?: Metric;
}) {
  const status = labStatus(record, metric);
  const appearance = labStatuses[status];
  return (
    <span className={`lab-status lab-status-${status}`} data-status={status}>
      <span aria-hidden="true">{appearance.icon}</span> {appearance.label}
    </span>
  );
}
