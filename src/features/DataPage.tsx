import { CsvImport } from "../components/CsvImport";
import { Urine } from "./Urine";
import { labGroups } from "../data/metrics";
import { useState } from "react";
import { useStore } from "../lib/store";
import { useDefinitions } from "../data/useDefinitions";
import { PageHeader } from "../components/health";
import { Search, LayoutGrid, List, Download, Plus } from "lucide-react";
import {
  withinDays,
  csvCell,
  download,
  type Metric,
  type HealthRecord,
} from "../lib/model";
import { Empty, SectionTitle } from "../components/ui";
import {
  MetricCard,
  RecordsList,
  CustomMetric,
  Confirm,
} from "../components/health";
import { RecordForm } from "../components/Forms";
import { MetricPicker } from "../components/MetricPicker";
export function DataPage({ labs = false }: { labs?: boolean }) {
  const allDefs = useDefinitions();
  const { data, commit } = useStore();
  const defs = allDefs.filter(
    (m) =>
      (labs ? m.group !== "日常健康" : m.group === "日常健康") &&
      (m.id !== "urine" || data.records.some((r) => r.metricId === "urine")),
  );
  const [selection, setSelection] = useState(
    new URLSearchParams(location.search).get("metric") ?? "all",
  );
  const [group, setGroup] = useState(
    new URLSearchParams(location.search).get("group") ?? "all",
  );
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("cards");
  const [days, setDays] = useState(0);
  const [form, setForm] = useState<{ metric: Metric; record?: HealthRecord }>();
  const [remove, setRemove] = useState<HealthRecord>();
  const [picker, setPicker] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const selected = defs.filter(
    (m) =>
      (group === "all" || m.group === group) &&
      (selection === "all" || m.id === selection) &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.english.toLowerCase().includes(search.toLowerCase())),
  );
  const matching = data.records.filter((r) =>
    selected.some((m) => m.id === r.metricId),
  );
  const rows = days === 0 ? matching : withinDays(matching, days);
  function exportCSV() {
    const header = [
      "指標",
      "數值",
      "第二數值",
      "單位",
      "日期時間",
      "情境",
      "參考下限",
      "參考上限",
      "機構",
      "備註",
      "資料來源",
    ];
    const values = rows.map((r) => {
      const m = defs.find((x) => x.id === r.metricId)!;
      return [
        m.name,
        r.value,
        r.secondary,
        m.unit,
        r.at,
        r.context,
        r.low,
        r.high,
        r.institution,
        r.note,
        r.source,
      ];
    });
    download(
      "SELF-CARE-健康紀錄.csv",
      "\ufeff" +
        [header, ...values].map((r) => r.map(csvCell).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  return (
    <>
      <PageHeader
        title={labs ? "🧪 檢驗與檢查" : "健康數據"}
        sub={
          labs
            ? "讓每一次檢驗結果，都能被好好保存與比較。"
            : "記錄日常測量，建立屬於自己的健康檔案。"
        }
        action={
          <button
            className="button"
            onClick={() => {
              const m = defs.find((m) => m.id === selection);
              if (m) setForm({ metric: m });
              else setPicker(true);
            }}
          >
            <Plus size={18} />
            新增紀錄
          </button>
        }
      />
      {labs && (
        <nav className="category-grid" aria-label="檢驗分類">
          {[
            "all",
            ...labGroups,
            ...new Set(
              defs.map((m) => m.group).filter((g) => !labGroups.includes(g)),
            ),
          ].map((g) => (
            <button
              key={g}
              aria-pressed={group === g}
              className={group === g ? "active" : ""}
              onClick={() => {
                setGroup(g);
                setSelection("all");
                setSearch("");
              }}
            >
              {g === "all" ? "全部檢驗" : g === "腫瘤標記" ? "🧬 腫瘤標記" : g}
            </button>
          ))}
        </nav>
      )}
      {labs && group === "腫瘤標記" && (
        <p className="form-note">
          腫瘤標記（俗稱癌症指數）· 保存原始報告與追蹤變化，數值不作診斷判定。
        </p>
      )}
      {labs && (group === "all" || group === "尿液檢查") && <Urine />}
      <button className="button secondary" onClick={() => setCsvOpen(true)}>
        CSV 匯入
      </button>
      {csvOpen && <CsvImport close={() => setCsvOpen(false)} />}
      <div className="filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input
            placeholder="搜尋指標名稱…"
            aria-label="搜尋指標"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setGroup("all");
            }}
          />
        </label>
        <select
          aria-label="指標篩選"
          value={selection}
          onChange={(e) => {
            setSelection(e.target.value);
            setGroup("all");
          }}
        >
          <option value="all">所有指標</option>
          {defs.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          aria-label="日期篩選"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {[
            [7, "最近 7 天"],
            [30, "最近 30 天"],
            [90, "最近 90 天"],
            [365, "最近 1 年"],
            [0, "全部紀錄"],
          ].map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
        <div className="segmented">
          <button
            className={mode === "cards" ? "active" : ""}
            onClick={() => setMode("cards")}
            aria-label="指標卡片"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            className={mode === "list" ? "active" : ""}
            onClick={() => setMode("list")}
            aria-label="歷史列表"
          >
            <List size={18} />
          </button>
        </div>
        <button className="button secondary" onClick={exportCSV}>
          <Download size={16} />
          CSV 匯出
        </button>
      </div>
      <p className="muted">
        本機 Demo · 篩選期間共 {rows.length} 筆紀錄。
        {labs ? "參考區間依每份報告保存，未填寫時不判定。" : ""}
      </p>
      {mode === "list" ? (
        <section className="panel">
          <RecordsList
            rows={rows}
            defs={defs}
            edit={(r) =>
              setForm({
                metric: defs.find((m) => m.id === r.metricId)!,
                record: r,
              })
            }
            remove={setRemove}
          />
        </section>
      ) : (
        <>
          {[...new Set(selected.map((m) => m.group))].map((group) => (
            <section key={group} className="data-group">
              <SectionTitle
                title={group}
                action={
                  <span className="muted">
                    {selected.filter((m) => m.group === group).length} 項
                  </span>
                }
              />
              <div className="metrics-grid data-grid">
                {selected
                  .filter((m) => m.group === group)
                  .map((m) => (
                    <MetricCard
                      key={m.id}
                      m={m}
                      rows={rows}
                      open={() => setForm({ metric: m })}
                      detail={() => {
                        setSelection(m.id);
                        setMode("list");
                      }}
                    />
                  ))}
              </div>
            </section>
          ))}
          {!selected.length && <Empty title="找不到符合的指標" />}
        </>
      )}
      <button className="custom-add" onClick={() => setCustom(true)}>
        <Plus size={18} />
        {labs && group === "腫瘤標記"
          ? "新增其他腫瘤標記項目"
          : `新增自訂${labs ? "檢驗" : "健康"}指標`}
      </button>
      {picker && (
        <MetricPicker
          definitions={
            group === "all" ? defs : defs.filter((m) => m.group === group)
          }
          close={() => setPicker(false)}
          choose={(m) => {
            setPicker(false);
            setForm({ metric: m });
          }}
        />
      )}
      {form && <RecordForm {...form} close={() => setForm(undefined)} />}{" "}
      {remove && (
        <Confirm
          title="刪除此筆紀錄？"
          description="刪除後趨勢與時間軸將一併更新，此操作無法復原。"
          close={() => setRemove(undefined)}
          action={() =>
            commit((b) => ({
              ...b,
              records: b.records.filter((r) => r.id !== remove.id),
            }))
          }
        />
      )}{" "}
      {custom && (
        <CustomMetric
          labs={labs}
          initialGroup={group === "all" ? undefined : group}
          close={() => setCustom(false)}
        />
      )}
    </>
  );
}
