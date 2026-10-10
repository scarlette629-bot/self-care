import { CsvImport } from "../components/CsvImport";
import { useState, type FormEvent } from "react";
import { useStore } from "../lib/store";
import { urineSchema, urineSections, type UrineReport } from "../lib/urine";
import { localInput, formatTaipei, csvCell, download } from "../lib/model";
import { Modal, Empty } from "../components/ui";
import { Confirm } from "../components/health";
export function Urine() {
  const { data, commit, busy } = useStore();
  const [form, setForm] = useState<UrineReport | null | undefined>();
  const [remove, setRemove] = useState<UrineReport>();
  const [csvOpen, setCsvOpen] = useState(false);
  const [error, setError] = useState("");
  const rows = [...data.urine].sort(
    (a, b) => Date.parse(b.at) - Date.parse(a.at),
  );
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const row = urineSchema.safeParse({
      id: form?.id ?? crypto.randomUUID(),
      at: new Date(String(f.get("at")) + "+08:00").toISOString(),
      institution: f.get("institution"),
      note: f.get("note"),
      results: Object.fromEntries(
        urineSections.flatMap((s) =>
          s.fields.map(([key]) => [key, String(f.get(key) ?? "")]),
        ),
      ),
    });
    if (!row.success) {
      setError(row.error.issues.map((i) => i.message).join("；"));
      return;
    }
    try {
      await commit((b) => ({
        ...b,
        urine: [...b.urine.filter((r) => r.id !== row.data.id), row.data],
      }));
      setForm(undefined);
    } catch {
      setError("儲存失敗，請重試。");
    }
  }
  function exportCSV() {
    const fields = urineSections.flatMap((s) => s.fields);
    download(
      "SELF-CARE-尿液檢查.csv",
      "\ufeff" +
        [
          ["檢查時間", "檢驗院所", ...fields.map((f) => f[1]), "備註"],
          ...rows.map((r) => [
            r.at,
            r.institution,
            ...fields.map((f) => r.results[f[0]] ?? ""),
            r.note,
          ]),
        ]
          .map((r) => r.map(csvCell).join(","))
          .join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  return (
    <section aria-label="尿液檢查報告">
      {csvOpen && <CsvImport mode="urine" close={() => setCsvOpen(false)} />}
      <button className="button secondary" onClick={() => setCsvOpen(true)}>
        匯入尿液 CSV
      </button>
      <div className="section-title">
        <h2>尿液檢查</h2>
        <button
          className="button"
          onClick={() => {
            setError("");
            setForm(null);
          }}
        >
          ＋ 新增尿液報告
        </button>
      </div>
      <p className="form-note">
        依原始報告填寫三類共 18
        項結果；支援陰性、Trace、範圍與單位等文字，未填不視為陰性。
      </p>
      <button className="button secondary" onClick={exportCSV}>
        匯出尿液 CSV
      </button>
      <div className="journal-list">
        {rows.length ? (
          rows.map((r) => (
            <article key={r.id} className="panel journal-card">
              <div className="section-title">
                <h3>{formatTaipei(r.at, "yyyy/MM/dd HH:mm")}</h3>
                <div className="row-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setError("");
                      setForm(r);
                    }}
                  >
                    編輯尿液報告
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label="刪除尿液報告"
                    onClick={() => setRemove(r)}
                  >
                    ×
                  </button>
                </div>
              </div>
              <p>{r.institution || "未填院所"}</p>
              {urineSections.map((s) => (
                <details key={s.name} open>
                  <summary>{s.name}</summary>
                  <dl className="journal-details">
                    {s.fields
                      .filter(([k]) => r.results[k])
                      .map(([k, label]) => (
                        <div key={k}>
                          <dt>{label}</dt>
                          <dd>{r.results[k]}</dd>
                        </div>
                      ))}
                  </dl>
                </details>
              ))}
              {r.note && <p>{r.note}</p>}
            </article>
          ))
        ) : (
          <Empty title="尚無尿液檢查報告" />
        )}
      </div>
      {form !== undefined && (
        <Modal
          title={form ? "編輯尿液報告" : "新增尿液報告"}
          close={() => setForm(undefined)}
        >
          <form onSubmit={save}>
            <label>
              檢查日期與時間
              <input
                name="at"
                type="datetime-local"
                required
                defaultValue={localInput(form?.at)}
              />
            </label>
            <label>
              檢驗院所
              <input
                name="institution"
                maxLength={200}
                defaultValue={form?.institution}
              />
            </label>
            {urineSections.map((s) => (
              <fieldset className="urine-fields" key={s.name}>
                <legend>{s.name}</legend>
                {s.fields.map(([key, label, example]) => (
                  <label key={key}>
                    {label}
                    <input
                      name={key}
                      defaultValue={form?.results[key]}
                      placeholder={"例如：" + example}
                      maxLength={200}
                    />
                  </label>
                ))}
              </fieldset>
            ))}
            <label>
              報告備註
              <textarea
                name="note"
                defaultValue={form?.note}
                maxLength={3000}
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setForm(undefined)}
              >
                取消
              </button>
              <button className="button" disabled={busy}>
                儲存尿液報告
              </button>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Confirm
          title="刪除尿液報告？"
          description="整份報告及時間軸項目將移除。"
          close={() => setRemove(undefined)}
          action={() =>
            commit((b) => ({
              ...b,
              urine: b.urine.filter((r) => r.id !== remove.id),
            }))
          }
        />
      )}
    </section>
  );
}
