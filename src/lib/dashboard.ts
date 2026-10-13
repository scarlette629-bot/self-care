import type { Backup, HealthRecord, Metric, Settings } from "./model";

// Missing preferences retain exactly the former dashboard selection. An explicit
// empty array means the user has intentionally removed every home card.
export function homeMetricIds(settings: Settings, definitions: Metric[]) {
  return (
    settings.homeMetricIds ??
    definitions
      .filter((m) => m.group === "日常健康" && !settings.hidden.includes(m.id))
      .slice(0, 4)
      .map((m) => m.id)
  );
}
export function selectHomeMetric(
  b: Backup,
  definitions: Metric[],
  id: string,
  selected: boolean,
): Backup {
  const ids = homeMetricIds(b.settings, definitions);
  return {
    ...b,
    settings: {
      ...b.settings,
      homeMetricIds: selected
        ? [...new Set([...ids, id])]
        : ids.filter((x) => x !== id),
    },
  };
}
export function latestRecords(rows: HealthRecord[]) {
  const latest = new Map<string, HealthRecord>();
  for (const r of rows) {
    const previous = latest.get(r.metricId);
    if (!previous || new Date(r.at).getTime() > new Date(previous.at).getTime())
      latest.set(r.metricId, r);
  }
  return latest;
}
