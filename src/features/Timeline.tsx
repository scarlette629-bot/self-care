import { barthelTotal } from "../lib/barthel";
import { useState } from "react";
import { useStore } from "../lib/store";
import { useDefinitions } from "../data/useDefinitions";
import { PageHeader } from "../components/health";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { formatTaipei as format, withinDays, formatValue } from "../lib/model";
import { Empty } from "../components/ui";
export function Timeline() {
  const data = useStore((s) => s.data);
  const defs = useDefinitions();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [days, setDays] = useState(365);
  const measurements = data.records.map((r) => {
    const m = defs.find((m) => m.id === r.metricId);
    return {
      id: r.id,
      at: r.at,
      kind: "健康測量",
      title: `${m?.name} ${m ? formatValue(r, m) : r.value} ${m?.unit}`,
      note: r.note,
      to: m?.group === "日常健康" ? "/data" : "/labs",
    };
  });
  const reminders = data.reminders
    .filter((r) => r.done)
    .map((r) => ({
      id: r.id,
      at: r.completedAt ?? r.at,
      kind: "完成安排",
      title: r.name,
      note: r.completedAt
        ? r.note
        : `完成時間未保存；此處顯示預定時間。${r.note}`,
      to: "/reminders",
    }));
  const events = data.events.map((e) => ({
    ...e,
    to: ["生理週期", "偏頭痛", "經前症狀", "更年期症狀", "用藥紀錄"].includes(
      e.kind,
    )
      ? "/women"
      : "/aging",
  }));
  const women = data.women.map((e) => ({
    id: e.id,
    at: e.at,
    kind: e.kind,
    title: e.kind + (e.details.medicine ? ` · ${e.details.medicine}` : ""),
    note: Object.values(e.details).filter(Boolean).join(" · ") + " " + e.note,
    to: "/women",
  }));
  const care = data.care.flatMap((p) =>
    p.visits.map((v) => ({
      id: `${p.id}:${v.id}`,
      at: v.date + "T00:00:00+08:00",
      kind: p.category,
      title: p.name + (v.dose ? ` · 第 ${v.dose} 劑` : ""),
      note: [v.clinic, v.result, v.summary].filter(Boolean).join(" · "),
      to: `/preventive?plan=${p.id}`,
    })),
  );
  const urine = data.urine.map((r) => ({
    id: r.id,
    at: r.at,
    kind: "尿液檢查",
    title: "尿液檢查報告",
    note: r.institution + " " + r.note,
    to: "/labs?group=尿液檢查",
  }));
  const barthel = data.barthel.map((r) => ({
    id: r.id,
    at: r.at,
    kind: "日常生活功能",
    title: `巴氏量表 ${barthelTotal(r.scores)} / 100 分`,
    note: r.description + " " + r.note,
    to: "/aging?kind=日常生活功能",
  }));
  const all = [
    ...barthel,
    ...urine,
    ...measurements,
    ...reminders,
    ...events,
    ...women,
    ...care,
  ];
  const rows = (
    days === 0
      ? [...all].sort(
          (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
        )
      : withinDays(all, days)
  )
    .filter(
      (r) =>
        (filter === "all" || r.kind === filter) &&
        (r.title + r.note).includes(search),
    )
    .reverse();
  return (
    <>
      <PageHeader
        title="我的健康時間軸"
        sub="把重要的健康時刻，串成自己的故事。"
      />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="搜尋事件"
            placeholder="搜尋紀錄與備註…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="事件類別"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">所有類別</option>
          {[...new Set(all.map((e) => e.kind))].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <select
          aria-label="時間軸期間"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {[7, 30, 90, 365, 0].map((d) => (
            <option key={d} value={d}>
              {d === 0 ? "全部" : `最近 ${d} 天`}
            </option>
          ))}
        </select>
      </div>
      <section className="panel timeline">
        {rows.length ? (
          rows.map((r) => (
            <button
              className="timeline-row"
              key={r.id}
              onClick={() => navigate(r.to)}
            >
              <span className="timeline-dot" />
              <time>{format(new Date(r.at), "yyyy/MM/dd HH:mm")}</time>
              <div>
                <small>{r.kind}</small>
                <b>{r.title}</b>
                <p>{r.note}</p>
              </div>
              <ChevronRight size={18} />
            </button>
          ))
        ) : (
          <Empty title="時間軸還是空白的" />
        )}
      </section>
    </>
  );
}
