import { LabStatusBadge } from "../components/LabStatusBadge";
import { useState } from "react";
import { useStore } from "../lib/store";
import { useDefinitions } from "../data/useDefinitions";
import { PageHeader } from "../components/health";
import { Leaf, ChevronDown } from "lucide-react";
import { withinDays, formatValue, formatTaipei } from "../lib/model";
import { Empty, SectionTitle } from "../components/ui";
import { TrendChart } from "../components/TrendChart";
export function Trends() {
  const defs = useDefinitions();
  const records = useStore((s) => s.data.records);
  const [selection, setSelection] = useState("bp");
  const [days, setDays] = useState(30);
  const [view, setView] = useState("chart");
  const [advanced, setAdvanced] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const chosen =
    selection === "lipids"
      ? defs.filter((m) => m.group === "血脂")
      : defs.filter((m) => m.id === selection);
  const rows = records.filter((r) => chosen.some((m) => m.id === r.metricId));
  const filtered =
    days === 0
      ? rows.filter(
          (r) =>
            (!start || new Date(r.at) >= new Date(start + "T00:00:00+08:00")) &&
            (!end || new Date(r.at) <= new Date(end + "T23:59:59+08:00")),
        )
      : withinDays(rows, days);
  const average = filtered.length
    ? (filtered.reduce((s, r) => s + r.value, 0) / filtered.length).toFixed(1)
    : "—";
  const secondaryRows = filtered.filter((r) => r.secondary !== undefined);
  const secondaryAverage = secondaryRows.length
    ? (
        secondaryRows.reduce((n, r) => n + r.secondary!, 0) /
        secondaryRows.length
      ).toFixed(1)
    : "—";
  const shownAverage = chosen[0]?.secondary
    ? `${average} / ${secondaryAverage}`
    : average;
  return (
    <>
      <PageHeader title="健康趨勢" sub="把紀錄連成線，看見自己的長期變化。" />
      <section
        className={`panel trends-main ${advanced ? "advanced-open" : ""}`}
      >
        <SectionTitle
          title="我的健康變化"
          action={
            <div className="segmented">
              <button
                className={view === "chart" ? "active" : ""}
                onClick={() => setView("chart")}
              >
                圖表
              </button>
              <button
                className={view === "table" ? "active" : ""}
                onClick={() => setView("table")}
              >
                資料
              </button>
            </div>
          }
        />
        <div className="range-tabs trend-periods" aria-label="趨勢日期範圍">
          {[
            [7, "7 天"],
            [30, "30 天"],
            [90, "90 天"],
            [180, "6 個月"],
            [365, "1 年"],
            [730, "2 年"],
            [1095, "3 年"],
            [0, "自訂"],
          ].map(([v, t]) => (
            <button
              key={v}
              aria-pressed={days === v}
              className={`${days === v ? "active" : ""} ${[180, 0].includes(Number(v)) ? "extended-period" : ""}`}
              onClick={() => setDays(Number(v))}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mobile-trend-chips" aria-label="常用趨勢指標">
          {[
            ["bp", "血壓"],
            ["glucose", "血糖"],
            ["weight", "體重"],
            ["lipids", "血脂"],
          ].map(([v, t]) => (
            <button
              key={v}
              aria-pressed={selection === v}
              className={selection === v ? "active" : ""}
              onClick={() => setSelection(v)}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          className="mobile-more-options"
          aria-expanded={advanced}
          onClick={() => setAdvanced((v) => !v)}
        >
          {advanced ? "收起篩選" : "更多指標與日期"}
          <ChevronDown size={18} />
        </button>
        <label className="more-periods">
          更多期間
          <select
            aria-label="更多趨勢期間"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[
              [7, "7 天"],
              [30, "30 天"],
              [90, "90 天"],
              [180, "6 個月"],
              [365, "1 年"],
              [730, "2 年"],
              [1095, "3 年"],
              [0, "自訂日期"],
            ].map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {days === 0 && (
          <div className="form-grid trend-custom-dates">
            <label>
              開始日期
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              結束日期
              <input
                type="date"
                min={start}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
        )}
        <div className="trend-selector">
          <select
            aria-label="趨勢指標"
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
          >
            <option value="lipids">血脂（四項比較）</option>
            {defs.map((m) => (
              <option value={m.id} key={m.id}>
                {m.name} · {m.unit}
              </option>
            ))}
          </select>
          <span className="muted">
            {chosen.some((m) => m.group !== "日常健康")
              ? "檢驗原始值 · 每筆依當次報告判讀"
              : "每日平均 · 同單位比較 · 缺漏不補零"}
          </span>
        </div>
        <div className="trend-summary">
          <div>
            <span className="eyebrow">
              {days === 0 ? "自訂期間" : `最近 ${days} 天`}
            </span>
            <h2>{selection === "lipids" ? "血脂" : chosen[0]?.name}趨勢</h2>
          </div>
          <div className="average">
            <small>{selection === "lipids" ? "比較項目" : "期間平均"}</small>
            <b>
              {selection === "lipids" ? "4 項" : shownAverage}
              <small>
                {selection === "lipids" ? "" : ` ${chosen[0]?.unit}`}
              </small>
            </b>
            <small>{filtered.length} 筆紀錄</small>
          </div>
        </div>
        {view === "chart" ? (
          <TrendChart rows={filtered} definitions={chosen} height={340} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>指標</th>
                  <th>數值</th>
                  <th>參考區間</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .sort(
                    (a, b) =>
                      new Date(a.at).getTime() - new Date(b.at).getTime(),
                  )
                  .map((r) => {
                    const m = defs.find((m) => m.id === r.metricId)!;
                    return (
                      <tr key={r.id}>
                        <td>{formatTaipei(r.at, "yyyy/MM/dd HH:mm")}</td>
                        <td>{m.name}</td>
                        <td>
                          {formatValue(r, m)} {m.unit}
                        </td>
                        <td>
                          {r.low ?? "—"} – {r.high ?? "—"}
                        </td>
                        <td>
                          {m.group !== "日常健康" && (
                            <LabStatusBadge record={r} metric={m} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {!filtered.length && <Empty />}
          </div>
        )}
        <div className="chart-note">
          <Leaf size={20} />
          <p>
            期間共記錄 {filtered.length} 次。
            {chosen.some((m) => m.group !== "日常健康")
              ? "檢驗圖表呈現每筆原始數值與當次報告判讀。"
              : "圖表呈現各日平均值的變化。"}
            不代表疾病風險或醫療診斷。
          </p>
        </div>
      </section>
    </>
  );
}
