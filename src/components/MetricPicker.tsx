import { useState } from "react";
import { Search } from "lucide-react";
import type { Metric } from "../lib/model";
import { Modal, BadgeIcon, ChevronRight, Empty } from "./ui";
export function MetricPicker({
  definitions,
  choose,
  close,
}: {
  definitions: Metric[];
  choose: (m: Metric) => void;
  close: () => void;
}) {
  const [search, setSearch] = useState("");
  const rows = definitions.filter((m) =>
    (m.name + " " + m.english).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Modal title="想記錄哪一項？" close={close}>
      <p className="picker-hint">選擇指標後，直接填寫本次數值。</p>
      <label className="search-field picker-search">
        <Search size={20} />
        <input
          aria-label="搜尋要記錄的指標"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋血壓、血糖、檢驗…"
        />
      </label>
      <div className="metric-picker">
        {rows.map((m) => (
          <button
            key={m.id}
            onClick={() => choose(m)}
            aria-label={`記錄${m.name}`}
          >
            <BadgeIcon name={m.icon} color={m.color} />
            <span>
              <b>{m.name}</b>
              <small>
                {m.group} · {m.unit}
              </small>
            </span>
            <ChevronRight size={20} />
          </button>
        ))}
        {!rows.length && <Empty title="找不到這個指標" />}
      </div>
    </Modal>
  );
}
