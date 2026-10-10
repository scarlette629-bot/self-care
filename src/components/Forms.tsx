import { useState, type FormEvent } from "react";
import { useStore } from "../lib/store";
import {
  recordSchema,
  reminderSchema,
  eventSchema,
  localInput,
  type HealthRecord,
  type Reminder,
  type HealthEvent,
  type Metric,
} from "../lib/model";
import { Modal } from "./ui";
const iso = (v: FormDataEntryValue | null) =>
  new Date(String(v) + "+08:00").toISOString();
const num = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : Number(v);
export function RecordForm({
  metric,
  record,
  close,
}: {
  metric: Metric;
  record?: HealthRecord;
  close: () => void;
}) {
  const commit = useStore((s) => s.commit);
  const busy = useStore((s) => s.busy);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const row = recordSchema.parse({
        id: record?.id ?? crypto.randomUUID(),
        metricId: metric.id,
        value: num(f.get("value")),
        secondary: num(f.get("secondary")),
        at: iso(f.get("at")),
        context: String(f.get("context") ?? ""),
        note: String(f.get("note") ?? ""),
        institution: String(f.get("institution") ?? ""),
        low: num(f.get("low")),
        high: num(f.get("high")),
        source: "demo-local",
      });
      if (metric.secondary && row.secondary === undefined)
        throw new Error("請填寫舒張壓");
      if (
        [
          "bp",
          "heart",
          "glucose",
          "weight",
          "oxygen",
          "temp",
          "sleep",
          "steps",
        ].includes(metric.id) &&
        row.value < 0
      )
        throw new Error("請輸入非負值");
      if (metric.id === "oxygen" && row.value > 100)
        throw new Error("血氧不可大於 100%");
      if (
        metric.id === "bp" &&
        row.secondary !== undefined &&
        row.secondary > row.value
      )
        throw new Error("舒張壓不可大於收縮壓");
      await commit((b) => ({
        ...b,
        records: [...b.records.filter((r) => r.id !== row.id), row],
      }));
      close();
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "請檢查數值、日期與參考區間（下限不得大於上限）。",
      );
    }
  }
  return (
    <Modal
      title={`${record ? "編輯" : "新增"}${metric.name}紀錄`}
      close={close}
    >
      <form onSubmit={submit}>
        <div className="form-note">本機 Demo 紀錄 · 台北時間（UTC+8）</div>
        <label>
          測量日期與時間
          <input
            name="at"
            type="datetime-local"
            required
            defaultValue={localInput(record?.at)}
          />
        </label>
        <div className="form-grid">
          <label>
            {metric.secondary ? "收縮壓" : "數值"}（{metric.unit}）
            <input
              name="value"
              type="number"
              step="any"
              required
              defaultValue={record?.value}
              autoFocus
            />
          </label>
          {metric.secondary && (
            <label>
              舒張壓（mmHg）
              <input
                name="secondary"
                type="number"
                step="any"
                required
                defaultValue={record?.secondary}
              />
            </label>
          )}
        </div>
        <label>
          量測情境
          <select name="context" defaultValue={record?.context ?? ""}>
            {[
              "",
              "空腹",
              "飯前",
              "飯後",
              "睡前",
              "休息時",
              "運動後",
              "範例測量",
            ].map((x) => (
              <option key={x} value={x}>
                {x || "未指定"}
              </option>
            ))}
          </select>
        </label>
        {metric.group !== "日常健康" && (
          <>
            <div className="form-grid">
              <label>
                報告參考下限
                <input
                  name="low"
                  type="number"
                  step="any"
                  defaultValue={record?.low}
                />
              </label>
              <label>
                報告參考上限
                <input
                  name="high"
                  type="number"
                  step="any"
                  defaultValue={record?.high}
                />
              </label>
            </div>
            <label>
              檢驗機構
              <input
                name="institution"
                maxLength={200}
                defaultValue={record?.institution}
              />
            </label>
            <p className="muted">
              依當次報告填寫，可留空。範圍標記不代表疾病診斷。
            </p>
          </>
        )}
        <label>
          備註
          <textarea
            name="note"
            maxLength={2000}
            defaultValue={record?.note}
            placeholder="記下測量時的狀況…"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={close}>
            取消
          </button>
          <button className="button" disabled={busy}>
            {busy ? "儲存中…" : "儲存紀錄"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function ReminderForm({
  record,
  close,
}: {
  record?: Reminder;
  close: () => void;
}) {
  const commit = useStore((s) => s.commit);
  const busy = useStore((s) => s.busy);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const r = reminderSchema.parse({
        id: record?.id ?? crypto.randomUUID(),
        name: f.get("name"),
        category: f.get("category"),
        at: iso(f.get("at")),
        done: record?.done ?? false,
        completedAt: record?.completedAt,
        note: f.get("note"),
      });
      await commit((b) => ({
        ...b,
        reminders: [...b.reminders.filter((x) => x.id !== r.id), r],
      }));
      close();
    } catch {
      setError("請確認名稱及日期，或檢查本機儲存空間。");
    }
  }
  return (
    <Modal title={record ? "編輯提醒" : "新增提醒"} close={close}>
      <form onSubmit={submit}>
        <label>
          提醒名稱
          <input
            name="name"
            required
            maxLength={150}
            defaultValue={record?.name}
          />
        </label>
        <label>
          類別
          <select name="category" defaultValue={record?.category}>
            {[
              "健康量測",
              "用藥記錄",
              "回診",
              "檢驗",
              "預防保健",
              "疫苗",
              "運動",
              "自訂",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          預定日期與時間
          <input
            type="datetime-local"
            name="at"
            required
            defaultValue={localInput(record?.at)}
          />
        </label>
        <label>
          備註
          <textarea name="note" maxLength={2000} defaultValue={record?.note} />
        </label>
        <p className="form-note">
          目前提供 App 內提醒；關閉 App 後不會背景推播。
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={close}>
            取消
          </button>
          <button disabled={busy} className="button">
            儲存提醒
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function EventForm({
  kind,
  record,
  close,
}: {
  kind: string;
  record?: HealthEvent;
  close: () => void;
}) {
  const commit = useStore((s) => s.commit);
  const busy = useStore((s) => s.busy);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const r = eventSchema.parse({
        id: record?.id ?? crypto.randomUUID(),
        kind,
        title: f.get("title"),
        at: iso(f.get("at")),
        end: f.get("end") ? iso(f.get("end")) : undefined,
        severity: num(f.get("severity")),
        note: f.get("note"),
      });
      await commit((b) => ({
        ...b,
        events: [...b.events.filter((x) => x.id !== r.id), r],
      }));
      close();
    } catch {
      setError("請檢查日期順序、標題與嚴重程度（0–10）。");
    }
  }
  return (
    <Modal title={`${record ? "編輯" : "新增"}${kind}紀錄`} close={close}>
      <form onSubmit={submit}>
        <label>
          紀錄標題
          <input
            name="title"
            required
            maxLength={150}
            defaultValue={record?.title}
          />
        </label>
        <label>
          開始日期與時間
          <input
            name="at"
            required
            type="datetime-local"
            defaultValue={localInput(record?.at)}
          />
        </label>
        <label>
          結束日期與時間（選填）
          <input
            name="end"
            type="datetime-local"
            defaultValue={record?.end ? localInput(record.end) : ""}
          />
        </label>
        <label>
          主觀程度（0–10，選填）
          <input
            name="severity"
            type="number"
            min="0"
            max="10"
            step="1"
            defaultValue={record?.severity}
          />
        </label>
        <label>
          詳細紀錄
          <textarea
            name="note"
            maxLength={3000}
            defaultValue={record?.note}
            placeholder="症狀、測量方法、活動時間、用藥或其他觀察…"
          />
        </label>
        <p className="form-note">個人自我觀察紀錄，並非標準化醫療評估。</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={close}>
            取消
          </button>
          <button disabled={busy} className="button">
            儲存事件
          </button>
        </div>
      </form>
    </Modal>
  );
}
