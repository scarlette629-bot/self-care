import type { HealthRecord } from './model';
// Keep the latest record's pair together, including intentional blank limits.
export function referenceDefaults(metricId: string, records: HealthRecord[], editing?: HealthRecord) {
  const source = editing ?? records.filter(r => r.metricId === metricId)
    .reduce<HealthRecord | undefined>((latest,r) => !latest || Date.parse(r.at) >= Date.parse(latest.at) ? r : latest, undefined);
  return { low: source?.low, high: source?.high };
}
