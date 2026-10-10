import { useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useStore } from "../lib/store";
import { localInput, taipeiDay, formatTaipei } from "../lib/model";
import { addDays } from "../lib/care";
import {
  womenFields,
  womenKinds,
  womenSchema,
  cyclePrediction,
  overlapStats,
  dayOf,
  type WomenEntry,
  type WomenKind,
} from "../lib/women";
import { PageHeader, Confirm } from "../components/health";
import { Modal, Empty } from "../components/ui";
import { Preventive, FemaleCareHistory } from "./Preventive";
import { EventsPage } from "./EventsPage";

const sections = [...womenKinds, "女性預防保健", "女性健康趨勢"];
const subtitles = [
  "月經起迄、經血量與下次預估",
  "身體、情緒、睡眠與頭痛",
  "週期變化、症狀自評與停經紀錄",
  "開始、調整、換藥與停藥歷程",
  "發作、用藥及可能影響因子",
  "抹片、乳房超音波及乳房攝影",
  "交叉觀察與預防保健歷程",
];
export function Women() {
  const { data, commit } = useStore();
  const [section, setSection] = useState("生理週期");
  const [form, setForm] = useState<{ kind: WomenKind; entry?: WomenEntry }>();
  const [remove, setRemove] = useState<WomenEntry>();
  const rows = data.women
    .filter((e) => e.kind === section)
    .sort((a, b) => b.at.localeCompare(a.at));
  const prediction = cyclePrediction(data.women, taipeiDay(new Date()));
  const legacy = data.events.some((e) =>
    ["生理週期", "偏頭痛", "經前症狀", "更年期症狀", "用藥紀錄"].includes(
      e.kind,
    ),
  );
  return (
    <>
      <PageHeader
        title="🌸 女性健康與偏頭痛"
        sub="以自己的節奏，記錄週期、症狀與照護歷程。"
      />
      <nav className="women-sections" aria-label="女性健康分類">
        {sections.map((s, i) => (
          <button
            key={s}
            aria-pressed={section === s}
            className={section === s ? "active" : ""}
            onClick={() => setSection(s)}
          >
            <span className="section-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>
              <b>{s === "偏頭痛" ? "🧠 偏頭痛" : s}</b>
              <small>{subtitles[i]}</small>
            </span>
          </button>
        ))}
      </nav>
      {section === "女性預防保健" ? (
        <Preventive femaleOnly />
      ) : section === "女性健康趨勢" ? (
        <WomenTrends />
      ) : (
        <>
          <div className="section-title">
            <h2>{section}</h2>
            <button
              className="button"
              onClick={() => setForm({ kind: section as WomenKind })}
            >
              <Plus size={18} />
              新增{section === "荷爾蒙相關藥物" ? "用藥事件" : "紀錄"}
            </button>
          </div>
          {section === "生理週期" && (
            <section className="cycle-summary">
              <span className="eyebrow">CYCLE JOURNAL</span>
              <h3>
                {prediction
                  ? `下次生理期預估 · ${prediction.next}`
                  : "先記錄每次月經開始日期"}
              </h3>
              <p>
                {prediction
                  ? `最近 ${prediction.intervals} 個週期間隔平均 ${prediction.average} 天（${prediction.shortest}–${prediction.longest} 天）。`
                  : "至少 3 次不同的開始日期後，依最近最多 6 個間隔估計。"}
              </p>
              <small>
                依已記錄日期推算；可能受不完整紀錄影響，不適用於避孕或診斷。
                {prediction && prediction.next < taipeiDay(new Date())
                  ? " 預估日期已過，請確認是否有新紀錄。"
                  : ""}
              </small>
            </section>
          )}
          {section === "更年期與停經" && (
            <p className="form-note">
              症狀自評：0 無、1 輕、2 中、3
              重。各項分開呈現，屬個人觀察，不套用臨床量表或自動判定停經。
            </p>
          )}
          {section === "荷爾蒙相關藥物" && (
            <p className="form-note">
              每次開始、劑量調整、換藥與停藥請新增一筆事件，保留原有歷程。
            </p>
          )}
          <div className="journal-list">
            {rows.length ? (
              rows.map((e) => (
                <article className="panel journal-card" key={e.id}>
                  <div className="section-title">
                    <div>
                      <b>{formatTaipei(e.at, "yyyy/MM/dd HH:mm")}</b>
                      {e.end && (
                        <small className="block">
                          至 {formatTaipei(e.end, "yyyy/MM/dd HH:mm")}
                        </small>
                      )}
                    </div>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label={`編輯${section}紀錄`}
                        onClick={() => setForm({ kind: e.kind, entry: e })}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={`刪除${section}紀錄`}
                        onClick={() => setRemove(e)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <dl className="journal-details">
                    {womenFields[e.kind]
                      .filter((f) => e.details[f.key])
                      .map((f) => (
                        <div key={f.key}>
                          <dt>{f.label}</dt>
                          <dd>{e.details[f.key]}</dd>
                        </div>
                      ))}
                  </dl>
                  {e.note && <p>{e.note}</p>}
                </article>
              ))
            ) : (
              <Empty
                title={`尚無${section}紀錄`}
                action={
                  <button
                    className="button secondary"
                    onClick={() => setForm({ kind: section as WomenKind })}
                  >
                    開始記錄
                  </button>
                }
              />
            )}
          </div>
        </>
      )}
      {legacy && (
        <details className="legacy-journal">
          <summary>查看先前版本的一般女性健康紀錄</summary>
          <EventsPage women />
        </details>
      )}
      {form && <WomenForm {...form} close={() => setForm(undefined)} />}
      {remove && (
        <Confirm
          title="刪除此筆女性健康紀錄？"
          description="週期預估、交叉觀察及時間軸會一併更新。"
          close={() => setRemove(undefined)}
          action={() =>
            commit((b) => ({
              ...b,
              women: b.women.filter((e) => e.id !== remove.id),
            }))
          }
        />
      )}
    </>
  );
}
function WomenForm({
  kind,
  entry,
  close,
}: {
  kind: WomenKind;
  entry?: WomenEntry;
  close: () => void;
}) {
  const { commit, busy } = useStore();
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const start = String(f.get("at")),
      end = String(f.get("end") ?? "");
    const parsed = womenSchema.safeParse({
      id: entry?.id ?? crypto.randomUUID(),
      kind,
      at: new Date(start + "+08:00").toISOString(),
      end: end ? new Date(end + "+08:00").toISOString() : undefined,
      note: String(f.get("note") ?? ""),
      details: Object.fromEntries(
        womenFields[kind].map((field) => [
          field.key,
          String(f.get(field.key) ?? "").trim(),
        ]),
      ),
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("；"));
      return;
    }
    try {
      await commit((b) => ({
        ...b,
        women: [...b.women.filter((x) => x.id !== parsed.data.id), parsed.data],
      }));
      close();
    } catch {
      setError("儲存失敗，請重試。");
    }
  }
  return (
    <Modal title={`${entry ? "編輯" : "新增"}${kind}`} close={close}>
      <form onSubmit={submit}>
        <label>
          {kind === "生理週期"
            ? "月經開始"
            : kind === "偏頭痛"
              ? "發作時間"
              : kind === "荷爾蒙相關藥物"
                ? "開始 / 調整 / 停藥日期時間"
                : "記錄開始時間"}
          <input
            name="at"
            type="datetime-local"
            required
            defaultValue={localInput(entry?.at)}
          />
        </label>
        {["生理週期", "經前症候群", "更年期與停經"].includes(kind) && (
          <label>
            {kind === "生理週期"
              ? "月經結束（可稍後補填）"
              : "症狀結束時間（選填）"}
            <input
              name="end"
              type="datetime-local"
              defaultValue={entry?.end ? localInput(entry.end) : ""}
            />
          </label>
        )}
        {kind === "更年期與停經" && (
          <p className="form-note">
            更年期症狀評估：0 無、1 輕、2 中、3 重；未觀察的項目請留白。
          </p>
        )}
        {womenFields[kind].map((field) => (
          <label key={field.key}>
            {field.label}
            {field.required ? " *" : ""}
            {field.type === "textarea" ? (
              <textarea
                name={field.key}
                defaultValue={entry?.details[field.key]}
                maxLength={3000}
              />
            ) : field.type === "select" ? (
              <select
                name={field.key}
                defaultValue={entry?.details[field.key] ?? field.options?.[0]}
              >
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                name={field.key}
                type={field.type ?? "text"}
                required={field.required}
                defaultValue={entry?.details[field.key]}
                min={field.min}
                max={field.max}
                step={field.step}
                maxLength={3000}
                inputMode={field.type === "number" ? "decimal" : undefined}
              />
            )}
          </label>
        ))}
        <label>
          補充備註
          <textarea name="note" maxLength={3000} defaultValue={entry?.note} />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={close}>
            取消
          </button>
          <button className="button" disabled={busy}>
            儲存女性健康紀錄
          </button>
        </div>
      </form>
    </Modal>
  );
}
function WomenTrends() {
  const entries = useStore((s) => s.data.women);
  const today = taipeiDay(new Date());
  const [comparison, setComparison] = useState("生理週期");
  const kinds = [
    "生理週期",
    "經前症候群",
    "更年期與停經",
    "荷爾蒙相關藥物",
    "其他影響因子",
  ];
  const attacks = entries
    .filter(
      (e) =>
        e.kind === "偏頭痛" &&
        dayOf(e.at) >= addDays(today, -364) &&
        dayOf(e.at) <= today,
    )
    .sort((a, b) => a.at.localeCompare(b.at));
  const points = new Map<string, number>();
  attacks.forEach((e) =>
    points.set(
      dayOf(e.at),
      Math.max(points.get(dayOf(e.at)) ?? 0, Number(e.details.pain)),
    ),
  );
  const factors = new Map<string, number>();
  attacks.forEach((e) => {
    for (const f of new Set(
      (e.details.factors ?? "")
        .split(/[,，、\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ))
      factors.set(f, (factors.get(f) ?? 0) + 1);
  });
  const stats =
    comparison === "其他影響因子"
      ? undefined
      : overlapStats(entries, comparison as WomenKind, today);
  const relevant = entries
    .filter(
      (e) =>
        e.kind === comparison &&
        dayOf(e.at) <= today &&
        dayOf(e.end ?? e.at) >= addDays(today, -364),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <div className="section-title">
        <h2>📈 女性健康趨勢</h2>
        <span className="pill">最近 365 天</span>
      </div>
      <section className="panel">
        <h3>偏頭痛發作紀錄</h3>
        <p className="muted">
          {attacks.length} 次發作 · {points.size}{" "}
          個發作起始日。圖表顯示每日最高疼痛分數，沒有紀錄的日期不補零。
        </p>
        {points.size ? (
          <div
            className="women-chart"
            role="img"
            aria-label="最近一年偏頭痛每日最高疼痛分數折線圖"
          >
            <ResponsiveContainer width="100%" height={230}>
              <LineChart
                data={[...points].map(([day, pain]) => ({ day, pain }))}
                margin={{ left: -25, right: 12, bottom: 5, top: 12 }}
              >
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d) => String(d).slice(5)}
                  minTickGap={35}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="linear"
                  dataKey="pain"
                  name="疼痛程度"
                  stroke="#b57999"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty title="新增偏頭痛紀錄後顯示趨勢" />
        )}
      </section>
      <section className="panel comparison-panel">
        <h3>交叉觀察</h3>
        <label>
          比較項目
          <select
            value={comparison}
            onChange={(e) => setComparison(e.target.value)}
          >
            {kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <h3>{comparison} × 偏頭痛</h3>
        {stats ? (
          <>
            <div className="observation-stats">
              <div>
                <b>{stats.observed}</b>
                <span>此類紀錄涵蓋日數</span>
              </div>
              <div>
                <b>{stats.overlap}</b>
                <span>其中與發作重疊日數</span>
              </div>
            </div>
            <p className="form-note">
              只比對已記錄的日期區間，未填結束時間只計當日。用藥事件僅計事件當日，不推定後續持續用藥。重疊日數不代表因果關係或發作風險。
            </p>
            {relevant.map((e) => (
              <div key={e.id} className="visit-summary">
                <b>
                  {dayOf(e.at)}
                  {e.end ? ` — ${dayOf(e.end)}` : ""}
                </b>
                <p>
                  {womenFields[e.kind]
                    .filter((f) => e.details[f.key])
                    .map((f) => `${f.label}：${e.details[f.key]}`)
                    .join(" · ") || "未填細節"}
                </p>
              </div>
            ))}
          </>
        ) : (
          <>
            <p className="form-note">
              統計已記錄發作中的因子出現次數，同一發作同名因子只計一次；可用逗號分隔。不推論因果。
            </p>
            {factors.size ? (
              [...factors]
                .sort((a, b) => b[1] - a[1])
                .map(([factor, count]) => (
                  <div className="factor-row" key={factor}>
                    <b>{factor}</b>
                    <span>
                      {count} / {attacks.length} 次發作
                    </span>
                  </div>
                ))
            ) : (
              <Empty title="尚未記錄影響因子" />
            )}
          </>
        )}
      </section>
      <FemaleCareHistory />
    </>
  );
}
