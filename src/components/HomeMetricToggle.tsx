import type { Metric } from "../lib/model";
import { homeMetricIds, selectHomeMetric } from "../lib/dashboard";
import { useDefinitions } from "../data/useDefinitions";
import { useStore } from "../lib/store";
import { useState } from "react";
export function HomeMetricToggle({ metric }: { metric: Metric }) {
  const { data, commit, busy } = useStore();
  const definitions = useDefinitions();
  const [pending, setPending] = useState<boolean>();
  return (
    <label className="home-metric-toggle">
      <input
        type="checkbox"
        aria-label={`${metric.name}加入首頁`}
        checked={
          pending ??
          homeMetricIds(data.settings, definitions).includes(metric.id)
        }
        disabled={busy || pending !== undefined}
        onChange={(e) => {
          const selected = e.currentTarget.checked;
          setPending(selected);
          void commit((b) =>
            selectHomeMetric(b, definitions, metric.id, selected),
          )
            .catch(() => {})
            .finally(() => setPending(undefined));
        }}
      />
      加入首頁
    </label>
  );
}
