import { CareReminderList } from "./Preventive";
import { useState } from "react";
import { useStore } from "../lib/store";
import { PageHeader } from "../components/health";
import { Plus, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { formatTaipei as format, taipeiDay, type Reminder } from "../lib/model";
import { Empty, Check } from "../components/ui";
import { Confirm } from "../components/health";
import { ReminderForm } from "../components/Forms";
export function Reminders({ preventive = false }: { preventive?: boolean }) {
  const { data, commit } = useStore();
  const [filter, setFilter] = useState("pending");
  const [form, setForm] = useState<Reminder | null | undefined>();
  const [remove, setRemove] = useState<Reminder>();
  const now = new Date();
  const rows = data.reminders
    .filter(
      (r) =>
        (!preventive ||
          ["預防保健", "回診", "疫苗", "檢驗"].includes(r.category)) &&
        (filter === "all" ||
          (filter === "done"
            ? r.done
            : filter === "today"
              ? !r.done && taipeiDay(r.at) === taipeiDay(now)
              : filter === "overdue"
                ? !r.done && new Date(r.at) < now
                : !r.done)),
    )
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return (
    <>
      <PageHeader
        title={preventive ? "預防保健" : "提醒與下一步行動"}
        sub={
          preventive
            ? "依你的個人安排，追蹤檢查、回診與疫苗事項。"
            : "讓每一件照顧自己的小事，都有一個溫柔的提醒。"
        }
        action={
          <button className="button" onClick={() => setForm(null)}>
            <Plus size={18} />
            新增提醒
          </button>
        }
      />
      <div className="range-tabs compact">
        {[
          ["pending", "待完成"],
          ["today", "今天"],
          ["overdue", "超過預定時間"],
          ["done", "已完成"],
          ["all", "全部"],
        ].map(([v, t]) => (
          <button
            key={v}
            className={filter === v ? "active" : ""}
            onClick={() => setFilter(v)}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="form-note">
        App 內提醒 ·
        流感可依年度安排，其餘依你設定的日期提醒；目前尚無背景推播。
      </p>
      <CareReminderList filter={filter} />
      <section className="panel">
        {rows.length ? (
          rows.map((r) => (
            <article
              className={`reminder-row ${r.done ? "completed" : ""}`}
              key={r.id}
            >
              <button
                className="check-circle"
                aria-label={`${r.done ? "取消完成" : "完成"}${r.name}`}
                onClick={() =>
                  void commit((b) => ({
                    ...b,
                    reminders: b.reminders.map((x) =>
                      x.id === r.id
                        ? {
                            ...x,
                            done: !x.done,
                            completedAt: x.done
                              ? undefined
                              : new Date().toISOString(),
                          }
                        : x,
                    ),
                  })).catch(() => {})
                }
              >
                {r.done && <Check size={17} />}
              </button>
              <div>
                <b>{r.name}</b>
                <small>
                  {format(new Date(r.at), "yyyy/MM/dd HH:mm")} · {r.category}
                </small>
                {r.note && <p>{r.note}</p>}
              </div>
              <span className="pill">
                {r.done
                  ? "已完成"
                  : new Date(r.at) < now
                    ? "超過預定時間"
                    : "待完成"}
              </span>
              <button
                className="icon-button"
                aria-label="延後一天"
                onClick={() =>
                  void commit((b) => ({
                    ...b,
                    reminders: b.reminders.map((x) => {
                      if (x.id !== r.id) return x;
                      const at = new Date(x.at);
                      at.setDate(at.getDate() + 1);
                      return { ...x, at: at.toISOString() };
                    }),
                  })).catch(() => {})
                }
              >
                <CalendarDays size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="編輯提醒"
                onClick={() => setForm(r)}
              >
                <Pencil size={17} />
              </button>
              <button
                className="icon-button danger"
                aria-label="刪除提醒"
                onClick={() => setRemove(r)}
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))
        ) : (
          <Empty
            title="目前沒有符合的提醒"
            action={
              <button
                className="button secondary"
                onClick={() => setForm(null)}
              >
                新增第一個提醒
              </button>
            }
          />
        )}
      </section>
      {form !== undefined && (
        <ReminderForm
          record={form ?? undefined}
          close={() => setForm(undefined)}
        />
      )}{" "}
      {remove && (
        <Confirm
          title="刪除這個提醒？"
          description="此提醒與完成狀態將被刪除。"
          action={() =>
            commit((b) => ({
              ...b,
              reminders: b.reminders.filter((x) => x.id !== remove.id),
            }))
          }
          close={() => setRemove(undefined)}
        />
      )}
    </>
  );
}
