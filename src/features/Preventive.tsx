import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { useStore } from "../lib/store";
import { taipeiDay } from "../lib/model";
import {
  careCategories,
  careSchema,
  careReminders,
  fluStatus,
  ageDate,
  type CarePlan,
  type CareVisit,
} from "../lib/care";
import { PageHeader, Confirm } from "../components/health";
import { Modal, Empty } from "../components/ui";

const icons = ["💉", "🩸", "🦷", "👁️", "🩺", "🌸", "📅"];
const templates: Record<string, string[]> = {
  疫苗管理: ["流感疫苗", "帶狀疱疹疫苗"],
  定期抽血: ["定期抽血"],
  "牙科 / 洗牙": ["牙科 / 洗牙"],
  "視力 / 眼科": ["視力 / 眼科"],
  健康檢查: ["健康檢查"],
  女性預防保健: ["子宮頸抹片", "乳房超音波", "乳房攝影"],
  回診追蹤: ["回診追蹤"],
};
function fresh(category: CarePlan["category"], name = ""): CarePlan {
  return {
    id: crypto.randomUUID(),
    category,
    name,
    type:
      name === "流感疫苗"
        ? "flu"
        : name === "帶狀疱疹疫苗"
          ? "shingles"
          : category === "疫苗管理"
            ? "vaccine"
            : "check",
    vaccineName: "",
    annualMonth: 10,
    nextDate: "",
    remind: category === "疫苗管理",
    visits: [],
  };
}
function blankVisit(): CareVisit {
  return {
    id: crypto.randomUUID(),
    date: taipeiDay(new Date()),
    clinic: "",
    result: "",
    summary: "",
  };
}

export function CareReminderList({
  filter = "pending",
  limit,
}: {
  filter?: string;
  limit?: number;
}) {
  const { care, settings } = useStore((s) => s.data);
  const today = taipeiDay(new Date());
  const rows = careReminders(care, settings.birthdate, today).filter((r) =>
    filter === "done"
      ? false
      : filter === "today"
        ? r.day === today
        : filter === "overdue"
          ? r.day < today
          : true,
  );
  if (!rows.length) return null;
  return (
    <section className="care-reminders" aria-label="預防保健提醒">
      <h3>預防保健提醒</h3>
      {rows.slice(0, limit ?? rows.length).map((r) => (
        <Link
          key={r.id}
          className="care-reminder"
          to={`/preventive?plan=${r.planId}`}
        >
          <span>
            <b>{r.name}</b>
            <small>
              {r.day} ·{" "}
              {r.day < today
                ? "超過預定日期"
                : r.day === today
                  ? "今天"
                  : "待安排"}
            </small>
          </span>
          <ChevronRight size={18} />
        </Link>
      ))}
      <p className="form-note">
        點選後填寫實際施打或檢查日期，更新完成狀態與下次提醒。
      </p>
    </section>
  );
}

export function Preventive({ femaleOnly = false }: { femaleOnly?: boolean }) {
  const { data, commit } = useStore();
  const [params, setParams] = useSearchParams();
  const targeted = data.care.find((p) => p.id === params.get("plan"));
  const [category, setCategory] = useState<CarePlan["category"]>(
    femaleOnly ? "女性預防保健" : (targeted?.category ?? "疫苗管理"),
  );
  const [form, setForm] = useState<CarePlan | undefined>(
    femaleOnly ? undefined : targeted,
  );
  const [remove, setRemove] = useState<CarePlan>();
  const today = taipeiDay(new Date());
  const plans = data.care.filter((p) => p.category === category);
  function open(name: string) {
    setForm(plans.find((p) => p.name === name) ?? fresh(category, name));
  }
  const close = () => {
    setForm(undefined);
    if (params.has("plan")) setParams({}, { replace: true });
  };
  return (
    <>
      {!femaleOnly && (
        <PageHeader
          title="🛡️ 預防保健"
          sub="管理疫苗、定期檢查與回診，保存每一次照顧自己的紀錄。"
        />
      )}
      {!femaleOnly && (
        <nav className="category-grid" aria-label="預防保健分類">
          {careCategories.map((c, i) => (
            <button
              key={c}
              aria-pressed={c === category}
              className={c === category ? "active" : ""}
              onClick={() => setCategory(c)}
            >
              {icons[i]} {c}
            </button>
          ))}
        </nav>
      )}
      <div className="section-title">
        <div>
          <span className="eyebrow">PREVENTIVE CARE</span>
          <h2>{category}</h2>
        </div>
        <button
          className="button secondary"
          onClick={() => setForm(fresh(category))}
        >
          <Plus size={18} />
          {category === "疫苗管理" ? "新增其他疫苗" : "新增項目"}
        </button>
      </div>
      {femaleOnly && (
        <p className="form-note">
          與「預防保健 → 女性預防保健」共用紀錄，編輯後兩處同步更新。
        </p>
      )}
      <div className="care-grid">
        {(templates[category] ?? [])
          .filter((name) => !plans.some((p) => p.name === name))
          .map((name) => (
            <button
              className="care-template"
              key={name}
              onClick={() => open(name)}
            >
              <span>
                <b>{name}</b>
                <small>
                  {name === "流感疫苗"
                    ? "每年提醒 · 預設 10 月"
                    : name === "帶狀疱疹疫苗"
                      ? "年齡提醒 · 第 1、2 劑紀錄"
                      : "檢查紀錄 · 結果 · 下次追蹤"}
                </small>
              </span>
              <Plus size={21} />
            </button>
          ))}
        {plans.map((p) => {
          const flu = p.type === "flu" ? fluStatus(p, today) : undefined;
          const dose1 = p.visits.find((v) => v.dose === 1),
            dose2 = p.visits.find((v) => v.dose === 2);
          const threshold =
            p.minAge !== undefined
              ? ageDate(data.settings.birthdate, p.minAge)
              : "";
          return (
            <article className="panel care-card" key={p.id}>
              <div className="section-title">
                <h3>{p.name}</h3>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`編輯${p.name}`}
                    onClick={() => setForm(p)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`刪除${p.name}`}
                    onClick={() => setRemove(p)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {p.vaccineName && <p>{p.vaccineName}</p>}
              {flu && (
                <div className="care-status">
                  <b>
                    {today.slice(0, 4)} 年度：
                    {flu.complete ? "已完成" : "尚未完成"}
                  </b>
                  <span>
                    每年 {p.annualMonth} 月提醒 ·{" "}
                    {p.remind ? "已開啟" : "已關閉"}
                  </span>
                  <span>
                    下年度提醒：{Number(today.slice(0, 4)) + 1}-
                    {String(p.annualMonth).padStart(2, "0")}-01
                  </span>
                  {p.remind && <span>目前提醒日期：{flu.next}</span>}
                </div>
              )}
              {p.type === "shingles" && (
                <div className="care-status">
                  <b>
                    {dose1 && dose2
                      ? "兩劑紀錄完成"
                      : dose1
                        ? "已記錄第 1 劑"
                        : "尚未記錄施打"}
                  </b>
                  <span>第 1 劑：{dose1?.date ?? "未記錄"}</span>
                  <span>第 2 劑：{dose2?.date ?? "未記錄"}</span>
                  <span>
                    年齡提醒：
                    {p.minAge === undefined
                      ? "尚未設定"
                      : `${p.minAge} 歲（自訂）`}
                    {p.minAge !== undefined &&
                      (threshold
                        ? ` · ${threshold <= today ? "已達設定年齡" : threshold}`
                        : " · 請於我的設定填寫生日")}
                  </span>
                </div>
              )}
              {p.type !== "flu" && (
                <p className="form-note">
                  {p.type === "check" ? "下次追蹤" : "下一劑提醒"}：
                  {p.nextDate || "尚未設定"} · 提醒{p.remind ? "開啟" : "關閉"}
                </p>
              )}
              <details className="care-history">
                <summary>查看紀錄（{p.visits.length} 筆）</summary>
                {[...p.visits]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((v) => (
                    <div className="visit-summary" key={v.id}>
                      <b>
                        {v.date}
                        {v.dose ? ` · 第 ${v.dose} 劑` : ""}
                      </b>
                      <span>{v.clinic || "未填院所"}</span>
                      {v.result && <p>結果：{v.result}</p>}
                      {v.summary && <p>{v.summary}</p>}
                    </div>
                  ))}
                {!p.visits.length && <p className="muted">尚無紀錄</p>}
              </details>
              <button
                className="button secondary full"
                disabled={p.type === "shingles" && Boolean(dose1 && dose2)}
                onClick={() =>
                  setForm({
                    ...p,
                    visits: [
                      ...p.visits,
                      {
                        ...blankVisit(),
                        dose:
                          p.type === "shingles" ? (dose1 ? 2 : 1) : undefined,
                      },
                    ],
                    nextDate: p.type === "flu" ? p.nextDate : "",
                  })
                }
              >
                <Plus size={17} />
                {p.type === "shingles" && dose1 && dose2
                  ? "兩劑紀錄已完成"
                  : `新增${p.type === "check" ? "檢查" : "施打"}紀錄`}
              </button>
            </article>
          );
        })}
      </div>
      <p className="form-note">
        提醒於 App 開啟時顯示，尚無背景推播。年齡條件與追蹤日期依你的安排設定。
      </p>
      {form && <CareForm key={form.id} initial={form} close={close} />}
      {remove && (
        <Confirm
          title={`刪除${remove.name}？`}
          description="將一併刪除此項目的歷次紀錄與提醒，兩個入口同步更新。"
          close={() => setRemove(undefined)}
          action={() =>
            commit((b) => ({
              ...b,
              care: b.care.filter((p) => p.id !== remove.id),
            }))
          }
        />
      )}
    </>
  );
}
function CareForm({
  initial,
  close,
}: {
  initial: CarePlan;
  close: () => void;
}) {
  const { commit, busy } = useStore();
  const [visits, setVisits] = useState(initial.visits);
  const [error, setError] = useState("");
  const [remind, setRemind] = useState(initial.remind);
  const update = (id: string, change: Partial<CareVisit>) =>
    setVisits((v) => v.map((x) => (x.id === id ? { ...x, ...change } : x)));
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = careSchema.safeParse({
      ...initial,
      name: f.get("name"),
      vaccineName: f.get("vaccineName") ?? "",
      annualMonth: Number(f.get("annualMonth") ?? 10),
      minAge: f.get("minAge") ? Number(f.get("minAge")) : undefined,
      nextDate: String(f.get("nextDate") ?? ""),
      remind,
      visits,
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("；"));
      return;
    }
    if (visits.some((v) => v.date > taipeiDay(new Date()))) {
      setError("實際施打 / 檢查日期不可在未來；預定日期請填入下次提醒。");
      return;
    }
    if (
      remind &&
      initial.type !== "flu" &&
      !parsed.data.nextDate &&
      !(
        initial.type === "shingles" &&
        parsed.data.minAge !== undefined &&
        !visits.length
      )
    ) {
      setError("請設定下次提醒日期，或先關閉提醒。");
      return;
    }
    try {
      await commit((b) => ({
        ...b,
        care: [...b.care.filter((p) => p.id !== initial.id), parsed.data],
      }));
      close();
    } catch {
      setError("儲存失敗，請重試。");
    }
  }
  return (
    <Modal
      title={`${initial.name || "新增" + (initial.type === "vaccine" ? "疫苗" : "保健項目")} · 設定與紀錄`}
      close={close}
    >
      <form onSubmit={submit}>
        <label>
          項目名稱
          <input
            name="name"
            defaultValue={initial.name}
            required
            maxLength={100}
          />
        </label>
        {initial.type !== "check" && (
          <label>
            疫苗名稱
            <input
              name="vaccineName"
              defaultValue={initial.vaccineName}
              maxLength={150}
              placeholder="填寫施打疫苗 / 品牌名稱"
            />
          </label>
        )}
        {initial.type === "flu" && (
          <label>
            每年提醒月份
            <select name="annualMonth" defaultValue={initial.annualMonth}>
              {Array.from({ length: 12 }, (_, i) => (
                <option value={i + 1} key={i}>
                  {i + 1} 月
                </option>
              ))}
            </select>
          </label>
        )}
        {initial.type === "shingles" && (
          <>
            <label>
              年齡條件提醒（歲，可留白）
              <input
                name="minAge"
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                step={1}
                defaultValue={initial.minAge}
              />
            </label>
            <p className="form-note">
              使用「我的設定」生日計算自訂年齡提醒；此設定不代表疫苗適用資格。第
              1、2 劑請分別記錄。
            </p>
          </>
        )}
        <div className="section-title">
          <h3>{initial.type === "check" ? "檢查紀錄" : "施打紀錄"}</h3>
          <button
            type="button"
            disabled={initial.type === "shingles" && visits.length >= 2}
            className="button secondary"
            onClick={() =>
              setVisits((v) => [
                ...v,
                {
                  ...blankVisit(),
                  dose:
                    initial.type === "shingles"
                      ? v.some((x) => x.dose === 1)
                        ? 2
                        : 1
                      : undefined,
                },
              ])
            }
          >
            ＋ 新增一筆
          </button>
        </div>
        {!visits.length && (
          <p className="muted">可先設定提醒，完成後再補上實際日期。</p>
        )}
        {visits.map((v, i) => (
          <details
            className="visit-editor"
            key={v.id}
            open={i === visits.length - 1}
          >
            <summary>
              第 {i + 1} 筆 · {v.date}
              {v.dose ? ` · 第 ${v.dose} 劑` : ""}
            </summary>
            <label>
              {initial.type === "check" ? "檢查日期" : "施打日期"}
              <input
                type="date"
                required
                max={taipeiDay(new Date())}
                value={v.date}
                onChange={(e) => update(v.id, { date: e.target.value })}
              />
            </label>
            {initial.type === "shingles" ? (
              <label>
                劑次
                <select
                  value={v.dose ?? 1}
                  onChange={(e) =>
                    update(v.id, { dose: Number(e.target.value) })
                  }
                >
                  <option value={1}>第 1 劑</option>
                  <option value={2}>第 2 劑</option>
                </select>
              </label>
            ) : (
              initial.type === "vaccine" && (
                <label>
                  劑次
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={v.dose ?? ""}
                    onChange={(e) =>
                      update(v.id, {
                        dose: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
              )
            )}
            <label>
              {initial.type === "check" ? "檢查院所" : "施打院所"}
              <input
                value={v.clinic}
                maxLength={200}
                onChange={(e) => update(v.id, { clinic: e.target.value })}
              />
            </label>
            {initial.type === "check" && (
              <label>
                檢查結果
                <input
                  value={v.result}
                  maxLength={1000}
                  onChange={(e) => update(v.id, { result: e.target.value })}
                />
              </label>
            )}
            <label>
              {initial.type === "check" ? "報告摘要 / 備註" : "施打備註"}
              <textarea
                value={v.summary}
                maxLength={3000}
                onChange={(e) => update(v.id, { summary: e.target.value })}
              />
            </label>
            <button
              type="button"
              className="text-button danger"
              onClick={() => setVisits((x) => x.filter((r) => r.id !== v.id))}
            >
              移除此筆（儲存後生效）
            </button>
          </details>
        ))}
        {initial.type !== "flu" && (
          <label>
            {initial.type === "check"
              ? "下次建議 / 追蹤日期"
              : "下一劑提醒日期"}
            <input
              name="nextDate"
              type="date"
              defaultValue={initial.nextDate}
            />
          </label>
        )}
        <label className="check-label">
          <input
            type="checkbox"
            checked={remind}
            onChange={(e) => setRemind(e.target.checked)}
          />
          🔔 {initial.type === "flu" ? "每年提醒" : "開啟提醒"}
        </label>
        {initial.type === "flu" && (
          <p className="form-note">
            依本年度施打紀錄顯示完成狀態；完成後改顯示下一年指定月份 1
            日的提醒。
          </p>
        )}
        {initial.type !== "flu" && (
          <p className="form-note">
            新增完成紀錄後，請更新下次追蹤日期；若沒有下次安排，可關閉提醒。
          </p>
        )}
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
            儲存保健紀錄
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function FemaleCareHistory() {
  const rows = useStore((s) => s.data.care)
    .filter((p) => p.category === "女性預防保健")
    .flatMap((p) => p.visits.map((v) => ({ ...v, name: p.name, planId: p.id })))
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="panel">
      <h3>女性預防保健歷程</h3>
      {rows.length ? (
        rows.map((v) => (
          <Link
            className="care-reminder"
            key={v.id}
            to={`/preventive?plan=${v.planId}`}
          >
            <span>
              <b>
                {v.date} · {v.name}
              </b>
              <small>
                {v.clinic || "未填院所"} · {v.result || "未填結果"}
              </small>
              {v.summary && <small>{v.summary}</small>}
            </span>
            <ChevronRight size={18} />
          </Link>
        ))
      ) : (
        <Empty title="尚無女性預防保健紀錄" />
      )}
    </section>
  );
}
