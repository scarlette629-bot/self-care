import { useState, type FormEvent } from "react";
import { useStore } from "../lib/store";
import {
  barthelItems,
  barthelTotal,
  barthelSchema,
  barthelSource,
  type BarthelRecord,
} from "../lib/barthel";
import { localInput, formatTaipei } from "../lib/model";
import { Modal, Empty } from "../components/ui";
import { Confirm } from "../components/health";
export function Barthel() {
  const { data, commit } = useStore();
  const [form, setForm] = useState<BarthelRecord | null | undefined>();
  const [remove, setRemove] = useState<BarthelRecord>();
  return (
    <section>
      <div className="section-title">
        <h2>日常生活功能 · 巴氏量表</h2>
        <button className="button" onClick={() => setForm(null)}>
          ＋ 新增評估
        </button>
      </div>
      <p className="form-note">
        10 題、總分 100 分，點選實際狀況後自動加總。
        <a href={barthelSource} target="_blank" rel="noreferrer">
          查看政府公開量表原表
        </a>
        。此處保存個人評估紀錄，不產生正式醫療證明。
      </p>
      <div className="journal-list">
        {data.barthel.length ? (
          [...data.barthel]
            .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
            .map((r) => (
              <article className="panel" key={r.id}>
                <div className="section-title">
                  <h3>{formatTaipei(r.at, "yyyy/MM/dd HH:mm")}</h3>
                  <strong>{barthelTotal(r.scores)} / 100 分</strong>
                </div>
                {r.description && <p>對象：{r.description}</p>}
                {r.caregiver && <p>照顧方式：{r.caregiver}</p>}
                <details>
                  <summary>查看各項分數</summary>
                  <dl className="journal-details">
                    {barthelItems.map((i) => (
                      <div key={i.id}>
                        <dt>{i.name}</dt>
                        <dd>
                          {r.scores[i.id]} 分 ·{" "}
                          {i.options.find((o) => o[0] === r.scores[i.id])?.[1]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
                {r.note && <p>{r.note}</p>}
                <div className="row-actions">
                  <button
                    className="button secondary"
                    onClick={() => setForm(r)}
                  >
                    編輯評估
                  </button>
                  <button
                    className="button secondary danger"
                    onClick={() => setRemove(r)}
                  >
                    刪除評估
                  </button>
                </div>
              </article>
            ))
        ) : (
          <Empty title="尚無巴氏量表評估" />
        )}
      </div>
      {form !== undefined && (
        <BarthelForm
          record={form ?? undefined}
          close={() => setForm(undefined)}
        />
      )}
      {remove && (
        <Confirm
          title="刪除巴氏量表評估？"
          description="評估與時間軸將一併移除。"
          close={() => setRemove(undefined)}
          action={() =>
            commit((b) => ({
              ...b,
              barthel: b.barthel.filter((r) => r.id !== remove.id),
            }))
          }
        />
      )}
      {data.events.some((e) => e.kind === "日常生活功能") && (
        <details>
          <summary>先前的一般生活功能紀錄</summary>
          {data.events
            .filter((e) => e.kind === "日常生活功能")
            .map((e) => (
              <p key={e.id}>
                {formatTaipei(e.at, "yyyy/MM/dd")} · {e.title} · {e.note}
                （未換算巴氏分數）
              </p>
            ))}
        </details>
      )}
    </section>
  );
}
function BarthelForm({
  record,
  close,
}: {
  record?: BarthelRecord;
  close: () => void;
}) {
  const { commit, busy } = useStore();
  const [scores, setScores] = useState<Record<string, number>>(
    record?.scores ?? {},
  );
  const [error, setError] = useState("");
  const total = barthelTotal(scores);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = barthelSchema.safeParse({
      id: record?.id ?? crypto.randomUUID(),
      at: new Date(String(f.get("at")) + "+08:00").toISOString(),
      version: "ntshb-adl-100-v1",
      description: f.get("description"),
      caregiver: f.get("caregiver"),
      note: f.get("note"),
      scores,
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("；"));
      return;
    }
    try {
      await commit((b) => ({
        ...b,
        barthel: [
          ...b.barthel.filter((r) => r.id !== parsed.data.id),
          parsed.data,
        ],
      }));
      close();
    } catch {
      setError("儲存失敗，請重試。");
    }
  }
  return (
    <Modal title={record ? "編輯巴氏量表" : "新增巴氏量表"} close={close}>
      <form onSubmit={save}>
        <label>
          評估日期與時間
          <input
            name="at"
            required
            type="datetime-local"
            defaultValue={localInput(record?.at)}
          />
        </label>
        <label>
          對象描述（選填）
          <input
            name="description"
            defaultValue={record?.description}
            maxLength={500}
            placeholder="例如：中風後復健中"
          />
        </label>
        <label>
          目前主要照顧方式（選填）
          <input
            name="caregiver"
            defaultValue={record?.caregiver}
            maxLength={500}
            placeholder="例如：家屬自行照顧"
          />
        </label>
        {["自我照顧能力", "行動能力"].map((group) => (
          <section key={group}>
            <h3>{group}</h3>
            {barthelItems
              .filter((i) => i.group === group)
              .map((i) => (
                <fieldset className="barthel-question" key={i.id}>
                  <legend>
                    {barthelItems.indexOf(i) + 1}. {i.name}
                  </legend>
                  {i.options.map(([score, text]) => (
                    <label
                      key={score}
                      className={`score-option ${scores[i.id] === score ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={i.id}
                        value={score}
                        checked={scores[i.id] === score}
                        onChange={() =>
                          setScores((s) => ({ ...s, [i.id]: score }))
                        }
                      />
                      <b className="score-points">{score} 分</b>
                      <span className="score-description">{text}</span>
                    </label>
                  ))}
                </fieldset>
              ))}
          </section>
        ))}
        <label>
          評估備註
          <textarea name="note" defaultValue={record?.note} maxLength={3000} />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions barthel-actions">
          <output aria-live="polite">
            {total === undefined
              ? `已填 ${Object.keys(scores).length} / 10 題 · 尚未完成`
              : `總分 ${total} / 100 分`}
          </output>
          <button type="button" className="button secondary" onClick={close}>
            取消
          </button>
          <button className="button" disabled={busy || total === undefined}>
            儲存評估
          </button>
        </div>
      </form>
    </Modal>
  );
}
