import { homeMetricIds, latestRecords } from "../lib/dashboard";
import { labStatus } from "../lib/labStatus";
import { LabStatusBadge } from "../components/LabStatusBadge";
import { formatValue } from "../lib/model";
import { CareReminderList } from "./Preventive";
import { useState } from "react";
import { useStore } from "../lib/store";
import { useDefinitions } from "../data/useDefinitions";
import { PageHeader } from "../components/health";
import { NavLink, useNavigate } from "react-router-dom";
import { Activity, CalendarDays, Leaf, Plus } from "lucide-react";
import { zhTW } from "date-fns/locale";
import {
  formatTaipei as format,
  taipeiDay,
  withinDays,
  type Metric,
} from "../lib/model";
import {
  BadgeIcon,
  Empty,
  SectionTitle,
  ArrowRight,
  ChevronRight,
} from "../components/ui";
import { MetricCard, date } from "../components/health";
import { RecordForm } from "../components/Forms";
import { TrendChart } from "../components/TrendChart";
import { MetricPicker } from "../components/MetricPicker";
export function Dashboard() {
  const { data, commit, busy } = useStore();
  const defs = useDefinitions();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Metric>();
  const [picker, setPicker] = useState(false);
  const period = data.settings.homeTrendDays ?? 7;
  const trendMetric =
    defs.find((m) => m.id === data.settings.homeTrendMetric) ??
    defs.find((m) => m.id === "bp")!;
  const latest = latestRecords(data.records);
  const abnormalLabs = defs
    .filter((m) => m.group !== "日常健康")
    .flatMap((m) => {
      const r = latest.get(m.id);
      return r && ["high", "low", "critical"].includes(labStatus(r, m))
        ? [{ m, r }]
        : [];
    });
  const today = data.records.filter(
    (r) => taipeiDay(r.at) === taipeiDay(new Date()),
  ).length;
  const pending = data.reminders
    .filter((r) => !r.done)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const selectedIds = new Set(homeMetricIds(data.settings, defs));
  const visible = defs.filter((m) => selectedIds.has(m.id));
  const metricRows = data.records.filter((r) => r.metricId === trendMetric.id);
  const trendRows = period === 0 ? metricRows : withinDays(metricRows, period);
  return (
    <>
      <PageHeader
        title={`${data.settings.nickname}，今天也好好照顧自己。`}
        sub={format(new Date(), "yyyy 年 M 月 d 日 EEEE", { locale: zhTW })}
        action={
          <button className="button" onClick={() => setPicker(true)}>
            <Plus size={19} />
            新增紀錄
          </button>
        }
      />
      <section className="mobile-quick-section" aria-label="快速記錄">
        <SectionTitle
          title="快速記錄"
          action={
            <button className="text-button" onClick={() => setPicker(true)}>
              更多指標
              <ChevronRight size={18} />
            </button>
          }
        />
        <div className="quick-metrics">
          {["bp", "glucose", "weight", "sleep"].map((id) => {
            const m = defs.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                onClick={() => setRecord(m)}
                aria-label={`快速記錄${m.name}`}
              >
                <BadgeIcon name={m.icon} color={m.color} />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
        <div className="mobile-module-shortcuts">
          <NavLink to="/labs">
            <BadgeIcon name="test" />
            檢驗數據
          </NavLink>
          <NavLink to="/women">
            <BadgeIcon name="flower" color="#b57999" />
            女性健康
          </NavLink>
          <NavLink to="/aging">
            <BadgeIcon name="leaf" color="#6a9975" />
            健康老化
          </NavLink>
          <NavLink to="/preventive">
            <BadgeIcon name="calendar" color="#b28b41" />
            預防保健
          </NavLink>
        </div>
      </section>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span />
            今日健康摘要
          </span>
          <h2>
            照顧自己，
            <br />
            從每一筆<span>紀錄</span>開始。
          </h2>
          <p>讓日常的小小紀錄，成為了解自己的線索。</p>
          <button className="hero-link" onClick={() => navigate("/data")}>
            開始記錄今天的健康
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="halo halo-one" />
          <span className="halo halo-two" />
          <div className="health-cross">
            <span />
            <i />
          </div>
          <Leaf className="hero-leaf" size={100} strokeWidth={1} />
          <div className="art-heart">
            <Activity size={42} />
          </div>
        </div>
        <div className="today-progress">
          <div className="progress-ring">
            <b>{today}</b>
            <span>筆紀錄</span>
          </div>
          <span>今日已記錄</span>
          <small>一點一滴，累積健康日常</small>
        </div>
      </section>
      <div className="dashboard-grid">
        <div className="dashboard-primary">
          <SectionTitle
            title="我的健康數據"
            eyebrow="DAILY HEALTH"
            action={
              <button className="text-button" onClick={() => navigate("/data")}>
                查看全部
                <ChevronRight size={16} />
              </button>
            }
          />
          <div className="metrics-grid">
            {visible.map((m) => (
              <MetricCard
                key={m.id}
                m={m}
                open={() => setRecord(m)}
                detail={() =>
                  navigate(
                    `${m.group === "日常健康" ? "/data" : "/labs"}?metric=${encodeURIComponent(m.id)}&view=history`,
                  )
                }
              />
            ))}
          </div>
          {!visible.length && (
            <Empty
              title="尚未選擇首頁指標"
              action={<NavLink to="/profile">設定顯示指標</NavLink>}
            />
          )}
          <section className="panel trend-panel">
            <SectionTitle
              title="看見健康的變化"
              eyebrow="HEALTH TRENDS"
              action={
                <button
                  className="text-button"
                  onClick={() => navigate("/trends")}
                >
                  完整趨勢
                  <ArrowRight size={16} />
                </button>
              }
            />
            <div className="trend-toolbar">
              <span className="chart-name">
                <BadgeIcon name={trendMetric.icon} color={trendMetric.color} />
                <span>
                  <select
                    aria-label="首頁趨勢指標"
                    disabled={busy}
                    value={trendMetric.id}
                    onChange={(e) => {
                      const homeTrendMetric = e.currentTarget.value;
                      void commit((b) => ({
                        ...b,
                        settings: { ...b.settings, homeTrendMetric },
                      })).catch(() => {});
                    }}
                  >
                    {defs.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <small>
                    共 {trendRows.length} 筆紀錄 · {trendMetric.unit}
                  </small>
                </span>
              </span>
              <div className="segmented">
                {[7, 30, 90, 365, 0].map((n) => (
                  <button
                    key={n}
                    className={period === n ? "active" : ""}
                    aria-pressed={period === n}
                    disabled={busy}
                    onClick={() =>
                      void commit((b) => ({
                        ...b,
                        settings: {
                          ...b.settings,
                          homeTrendDays: n as 0 | 7 | 30 | 90 | 365,
                        },
                      })).catch(() => {})
                    }
                  >
                    {n === 0 ? "全部" : n === 365 ? "1 年" : `${n} 天`}
                  </button>
                ))}
              </div>
            </div>
            <TrendChart
              rows={trendRows}
              definitions={[trendMetric]}
              height={220}
            />
          </section>
        </div>
        <div className="dashboard-secondary">
          <section className="panel lab-summary" aria-label="檢驗異常摘要">
            <SectionTitle title="檢驗異常摘要" eyebrow="LATEST LAB RESULTS" />
            <p className="muted">各項最新報告 · 依當次參考區間判讀</p>
            {abnormalLabs.length ? (
              abnormalLabs.map(({ m, r }) => (
                <NavLink
                  key={m.id}
                  to={`/labs?metric=${encodeURIComponent(m.id)}&view=history`}
                  className="lab-summary-item"
                >
                  <strong>{m.name}</strong>
                  <span>
                    {formatValue(r, m)} {m.unit}
                  </span>
                  <small>{format(r.at, "yyyy/MM/dd")}</small>
                  <LabStatusBadge record={r} metric={m} />
                </NavLink>
              ))
            ) : (
              <p className="quiet-empty">目前沒有已判定的異常檢驗</p>
            )}
            <p className="form-note">
              無適用參考區間的結果顯示未判定。目前未設定經審核的危急值門檻。
            </p>
          </section>
          <section className="panel next-panel">
            <SectionTitle
              title="接下來要做的事"
              eyebrow="A LITTLE CARE, EVERY DAY"
              action={
                <NavLink
                  to="/reminders"
                  className="icon-button"
                  aria-label="全部提醒"
                >
                  <ArrowRight size={18} />
                </NavLink>
              }
            />
            <div className="reminder-summary">
              <span>
                <CalendarDays size={17} />
                近期安排
              </span>
              <b>
                {pending.length}
                <small> 項待完成</small>
              </b>
            </div>
            {pending.length ? (
              pending.slice(0, 3).map((r) => (
                <div className="task" key={r.id}>
                  <button
                    className="check-circle"
                    aria-label={`完成${r.name}`}
                    onClick={() =>
                      void commit((b) => ({
                        ...b,
                        reminders: b.reminders.map((x) =>
                          x.id === r.id
                            ? {
                                ...x,
                                done: true,
                                completedAt: new Date().toISOString(),
                              }
                            : x,
                        ),
                      })).catch(() => {})
                    }
                  />
                  <div>
                    <strong>{r.name}</strong>
                    <small>
                      {date(r.at)} · {r.category}
                    </small>
                  </div>
                  <span className="task-dot" />
                </div>
              ))
            ) : (
              <div className="quiet-empty">
                目前沒有待辦事項
                <br />
                <small>給下一次照顧自己，一個提醒。</small>
              </div>
            )}
            <button
              className="button secondary full"
              onClick={() => navigate("/reminders")}
            >
              <Plus size={17} />
              管理我的提醒
            </button>
          </section>
          <CareReminderList limit={3} />
          <section className="panel modules-panel">
            <SectionTitle title="我的健康空間" eyebrow="MORE WAYS TO CARE" />
            {[
              {
                to: "/women",
                title: "女性健康",
                sub: "週期、症狀與偏頭痛紀錄",
                icon: "flower",
                color: "#b57999",
              },
              {
                to: "/aging",
                title: "健康老化",
                sub: "營養、活動與日常功能",
                icon: "leaf",
                color: "#6a9975",
              },
              {
                to: "/preventive",
                title: "預防保健",
                sub: "為下一次健康檢查做準備",
                icon: "calendar",
                color: "#c99b50",
              },
            ].map((m) => (
              <NavLink key={m.to} to={m.to} className="module-link">
                <BadgeIcon name={m.icon} color={m.color} />
                <span>
                  <strong>{m.title}</strong>
                  <small>{m.sub}</small>
                </span>
                <ChevronRight size={17} />
              </NavLink>
            ))}
          </section>
          <div className="daily-note">
            <span>SELF-CARE NOTE</span>
            <p>
              健康，不是一天的努力。
              <br />
              是每天願意多照顧自己一點。
            </p>
            <Leaf size={23} />
          </div>
        </div>
      </div>
      {picker && (
        <MetricPicker
          definitions={defs}
          close={() => setPicker(false)}
          choose={(m) => {
            setPicker(false);
            setRecord(m);
          }}
        />
      )}
      {record && (
        <RecordForm metric={record} close={() => setRecord(undefined)} />
      )}{" "}
    </>
  );
}
