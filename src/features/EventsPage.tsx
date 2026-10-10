import { Barthel } from "./Barthel";
import { useState } from "react";
import { useStore } from "../lib/store";
import { PageHeader } from "../components/health";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatTaipei as format, type HealthEvent } from "../lib/model";
import { Empty, SectionTitle, BadgeIcon } from "../components/ui";
import { Confirm, date } from "../components/health";
import { EventForm } from "../components/Forms";
export function EventsPage({ women = false }: { women?: boolean }) {
  const { data, commit } = useStore();
  const kinds = women
    ? ["生理週期", "經前症狀", "更年期症狀", "偏頭痛", "用藥紀錄"]
    : ["認知與記憶", "日常生活功能", "跌倒與行動安全"];
  const [kind, setKind] = useState(
    !women &&
      new URLSearchParams(location.search).get("kind") === "日常生活功能"
      ? "日常生活功能"
      : kinds[0],
  );
  const [form, setForm] = useState<HealthEvent | null | undefined>();
  const [remove, setRemove] = useState<HealthEvent>();
  const rows = data.events
    .filter((e) => e.kind === kind)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return (
    <>
      <PageHeader
        title={women ? "女性健康與偏頭痛" : "健康老化"}
        sub={
          women
            ? "聆聽身體的節奏，保存週期與症狀的日常觀察。"
            : "記錄認知、生活功能與行動安全。"
        }
        action={
          kind !== "日常生活功能" && (
            <button className="button" onClick={() => setForm(null)}>
              <Plus size={18} />
              新增紀錄
            </button>
          )
        }
      />
      <div className="module-tabs">
        {kinds.map((k) => (
          <button
            key={k}
            className={kind === k ? "active" : ""}
            onClick={() => setKind(k)}
          >
            {k}
          </button>
        ))}
      </div>
      {!women && kind === "日常生活功能" ? (
        <Barthel />
      ) : (
        <>
          <p className="form-note">
            {women
              ? "此處保留舊版一般日誌，可編輯原始紀錄；新的專用欄位與趨勢請使用上方七項分類。"
              : "提供事件日誌與主觀程度追蹤。此分類的專用評估尚未開放；日常生活功能可使用巴氏量表。"}
          </p>
          <section className="panel">
            <SectionTitle
              title={kind}
              action={<span className="muted">{rows.length} 筆紀錄</span>}
            />
            {rows.length ? (
              rows.map((e) => (
                <article className="event-row" key={e.id}>
                  <BadgeIcon
                    name={women ? "flower" : "leaf"}
                    color={women ? "#b57999" : "#6a9975"}
                  />
                  <div>
                    <b>{e.title}</b>
                    <small>
                      {format(new Date(e.at), "yyyy/MM/dd HH:mm")}
                      {e.end && ` ～ ${date(e.end)}`}
                    </small>
                    <p>{e.note}</p>
                    {e.severity !== undefined && (
                      <span className="pill">自評程度 {e.severity}/10</span>
                    )}
                  </div>
                  <button
                    className="icon-button"
                    aria-label="編輯事件"
                    onClick={() => setForm(e)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label="刪除事件"
                    onClick={() => setRemove(e)}
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))
            ) : (
              <Empty
                title={`尚無${kind}紀錄`}
                action={
                  <button
                    className="button secondary"
                    onClick={() => setForm(null)}
                  >
                    記下第一筆觀察
                  </button>
                }
              />
            )}
          </section>
        </>
      )}
      {form !== undefined && (
        <EventForm
          kind={kind}
          record={form ?? undefined}
          close={() => setForm(undefined)}
        />
      )}{" "}
      {remove && (
        <Confirm
          title="刪除這個事件？"
          description="原始紀錄與時間軸將一致更新。"
          action={() =>
            commit((b) => ({
              ...b,
              events: b.events.filter((x) => x.id !== remove.id),
            }))
          }
          close={() => setRemove(undefined)}
        />
      )}
    </>
  );
}
