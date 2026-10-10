import { labGroups } from "../data/metrics";
import { useState, type FormEvent, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useStore } from "../lib/store";
import {
  formatValue,
  reportStatus,
  formatTaipei,
  type HealthRecord,
  type Metric,
} from "../lib/model";
import { BadgeIcon, Empty, Modal, Plus } from "./ui";
export const date = (at: string) => formatTaipei(at, "MM/dd HH:mm");
export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">YOUR PERSONAL HEALTH JOURNEY</span>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </div>
  );
}
export function MetricCard({
  m,
  open,
  detail,
  rows,
}: {
  m: Metric;
  open: () => void;
  detail: () => void;
  rows?: HealthRecord[];
}) {
  const storedRecords = useStore((s) => s.data.records);
  const records = (rows ?? storedRecords)
    .filter((r) => r.metricId === m.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const r = records[0],
    prev = records[1];
  return (
    <article
      className="metric-card"
      style={{ "--metric": m.color } as import("react").CSSProperties}
    >
      <div className="metric-card-top">
        <button className="metric-label" onClick={detail}>
          <BadgeIcon name={m.icon} color={m.color} />
          <span>
            <strong>{m.name}</strong>
            <small>{m.english}</small>
          </span>
        </button>
        <button
          aria-label={`新增${m.name}`}
          className="add-metric"
          onClick={open}
        >
          <Plus size={19} />
        </button>
      </div>
      <button className="metric-reading" onClick={detail}>
        {r ? (
          <>
            <b>{formatValue(r, m)}</b>
            <span>{m.unit}</span>
          </>
        ) : (
          <strong className="no-record">尚無紀錄</strong>
        )}
      </button>
      <div className="metric-bottom">
        <small>{r ? date(r.at) : "從第一筆記錄開始"}</small>
        {r && prev && (
          <span className="delta">
            {r.value - prev.value > 0 ? "+" : ""}
            {Number((r.value - prev.value).toFixed(2))} <small>較前次</small>
          </span>
        )}
      </div>
      <div className="mini-bars" aria-hidden="true">
        {records
          .slice(0, 7)
          .reverse()
          .map((x, i) => (
            <i
              key={x.id}
              style={{
                height:
                  12 +
                  (x.value /
                    (Math.max(...records.slice(0, 7).map((r) => r.value)) ||
                      1)) *
                    15,
                opacity: 0.25 + i * 0.09,
              }}
            />
          ))}
      </div>
    </article>
  );
}
export function RecordsList({
  rows,
  defs,
  edit,
  remove,
}: {
  rows: HealthRecord[];
  defs: Metric[];
  edit: (r: HealthRecord) => void;
  remove: (r: HealthRecord) => void;
}) {
  return rows.length ? (
    <div className="records-list">
      {[...rows]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .map((r) => {
          const m = defs.find((m) => m.id === r.metricId);
          if (!m) return null;
          return (
            <article className="record-row" key={r.id}>
              <BadgeIcon name={m.icon} color={m.color} />
              <div className="record-info">
                <b>{m.name}</b>
                <small>
                  {date(r.at)} · {r.context || "未指定情境"}
                  {r.institution && ` · ${r.institution}`}
                </small>
                {r.note && <small className="record-note">{r.note}</small>}
                {reportStatus(r) !== "—" && (
                  <span className="report-warning">{reportStatus(r)}</span>
                )}
              </div>
              <strong>
                {formatValue(r, m)} <small>{m.unit}</small>
              </strong>
              <button
                className="icon-button"
                aria-label={`編輯${m.name}紀錄`}
                onClick={() => edit(r)}
              >
                <Pencil size={17} />
              </button>
              <button
                className="icon-button danger"
                aria-label={`刪除${m.name}紀錄`}
                onClick={() => remove(r)}
              >
                <Trash2 size={17} />
              </button>
            </article>
          );
        })}
    </div>
  ) : (
    <Empty />
  );
}
export function CustomMetric({
  labs,
  initialGroup,
  close,
}: {
  labs: boolean;
  initialGroup?: string;
  close: () => void;
}) {
  const commit = useStore((s) => s.commit);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    if (!name) {
      setError("請輸入名稱");
      return;
    }
    await commit((b) => ({
      ...b,
      custom: [
        ...b.custom,
        {
          id: crypto.randomUUID(),
          name,
          english: "Custom Metric",
          unit: String(f.get("unit")).trim(),
          group: labs ? String(f.get("group")) : "日常健康",
          icon: "activity",
          color: "#0e8587",
          custom: true,
        },
      ],
    }))
      .then(close)
      .catch(() => setError("儲存失敗，請稍後重試。"));
  }
  return (
    <Modal title="新增自訂數值指標" close={close}>
      <form onSubmit={submit}>
        {labs && (
          <label>
            檢驗分類
            <select name="group" defaultValue={initialGroup ?? "自訂檢驗"}>
              {[
                ...new Set([
                  ...labGroups,
                  ...(initialGroup ? [initialGroup] : []),
                ]),
              ].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          指標名稱
          <input name="name" required maxLength={50} />
        </label>
        <label>
          單位
          <input name="unit" maxLength={30} placeholder="例如：mL、分鐘、kg" />
        </label>
        <p className="form-note">
          首版支援單一數值型指標，可顯示趨勢與匯出資料。
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="button">建立指標</button>
        </div>
      </form>
    </Modal>
  );
}
export function Confirm({
  title,
  description,
  action,
  close,
}: {
  title: string;
  description: string;
  action: () => Promise<void>;
  close: () => void;
}) {
  const busy = useStore((s) => s.busy);
  return (
    <Modal title={title} close={close}>
      <p>{description}</p>
      <div className="form-actions">
        <button className="button secondary" onClick={close}>
          取消
        </button>
        <button
          className="button destructive"
          disabled={busy}
          onClick={() =>
            void action()
              .then(close)
              .catch(() => {})
          }
        >
          確認
        </button>
      </div>
    </Modal>
  );
}
