import { HomeMetricToggle } from "../components/HomeMetricToggle";
import { SecureBackup } from "../components/SecureBackup";
import { useState } from "react";
import { useStore } from "../lib/store";
import { useDefinitions } from "../data/useDefinitions";
import { PageHeader } from "../components/health";
import type { FormEvent } from "react";
import {
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { backupSchema, download } from "../lib/model";
import { emptyData } from "../data/repository";
import { metrics } from "../data/metrics";
import { SectionTitle, Modal, ArrowRight } from "../components/ui";
import { Confirm } from "../components/health";
export function Profile() {
  const { data, commit, busy } = useStore();
  const defs = useDefinitions();
  const [status, setStatus] = useState("");
  const [clear, setClear] = useState(false);
  const [imported, setImported] =
    useState<ReturnType<typeof backupSchema.parse>>();
  const [privacy, setPrivacy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await commit((b) => ({
        ...b,
        settings: {
          ...b.settings,
          nickname: String(f.get("nickname")).trim() || "朋友",
          birthdate: String(f.get("birthdate") ?? ""),
          height: f.get("height") ? Number(f.get("height")) : undefined,
        },
      }));
      setStatus("個人設定已儲存在此瀏覽器。");
    } catch {
      setStatus("儲存失敗，請檢查輸入與儲存空間。");
    }
  }
  return (
    <>
      <PageHeader title="我的" sub="調整你的健康空間，資料由你自己掌握。" />
      <section className="panel mobile-display-settings">
        <SectionTitle title="閱讀與顯示" />
        <label>
          文字大小
          <select
            aria-label="文字大小"
            value={data.settings.font}
            onChange={(e) => {
              const font = Number(e.currentTarget.value);
              void commit((b) => ({
                ...b,
                settings: { ...b.settings, font },
              })).catch(() => {});
            }}
          >
            <option value={1}>標準</option>
            <option value={1.15}>加大</option>
            <option value={1.3}>最大</option>
          </select>
        </label>
      </section>
      <SecureBackup />
      <div className="settings-grid">
        <section className="panel">
          <SectionTitle title="個人資料" />
          <form onSubmit={save}>
            <label>
              如何稱呼你
              <input
                name="nickname"
                maxLength={50}
                defaultValue={data.settings.nickname}
              />
            </label>
            <div className="form-grid">
              <label>
                出生日期（選填）
                <input
                  type="date"
                  name="birthdate"
                  defaultValue={data.settings.birthdate}
                />
              </label>
              <label>
                身高（cm，選填）
                <input
                  name="height"
                  type="number"
                  min="1"
                  max="300"
                  step="any"
                  defaultValue={data.settings.height}
                />
              </label>
            </div>
            <label>
              時區
              <input value="Asia/Taipei（UTC+8）" readOnly />
            </label>
            <button className="button" disabled={busy}>
              {busy ? "儲存中…" : "儲存個人資料"}
            </button>
          </form>
          {status && (
            <p role="status" className="form-note">
              {status}
            </p>
          )}
        </section>
        <section className="panel">
          <SectionTitle title="首頁指標" />
          <p className="muted">
            選擇日常健康、自訂及檢驗指標，可同時顯示多項。取消只影響首頁顯示。
          </p>
          {defs.map((m) => (
            <div className="toggle-row" key={m.id}>
              <span>{m.name}</span>
              <HomeMetricToggle metric={m} />
            </div>
          ))}
        </section>
        <section className="panel">
          <SectionTitle title="資料管理" />
          <p className="form-note">
            本機 Demo
            資料未加密，不建議輸入真實敏感健康資訊。刪除瀏覽器資料會清除紀錄。
          </p>
          <button
            className="settings-action"
            onClick={() =>
              download("SELF-CARE-backup.json", JSON.stringify(data, null, 2))
            }
          >
            <Download size={20} />
            <span>
              匯出完整 JSON 備份
              <small>包含數據、女性健康、保健紀錄、提醒與設定</small>
            </span>
            <ChevronRight size={18} />
          </button>
          <label className="settings-action">
            <Upload size={20} />
            <span>
              匯入 JSON 備份<small>先驗證版本與欄位，再確認取代</small>
            </span>
            <input
              className="file-input"
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 20 * 1024 * 1024)
                    throw new Error("too large");
                  const b = backupSchema.parse(JSON.parse(await file.text()));
                  const ids = new Set(
                    [...metrics, ...b.custom].map((m) => m.id),
                  );
                  if (b.records.some((r) => !ids.has(r.metricId)))
                    throw new Error("unknown metric");
                  setImported(b);
                } catch {
                  setStatus(
                    "備份格式錯誤、版本不支援或超過 20 MB，未匯入資料。",
                  );
                }
                e.target.value = "";
              }}
            />
          </label>
          <button
            className="settings-action danger"
            onClick={() => setClear(true)}
          >
            <Trash2 size={20} />
            <span>
              清除所有本機資料<small>包含全部紀錄與個人設定</small>
            </span>
            <ChevronRight size={18} />
          </button>
        </section>
        <section className="panel">
          <SectionTitle title="隱私與使用說明" />
          <div className="privacy-list">
            <ShieldCheck size={28} />
            <p>
              沒有第三方追蹤。資料保存在本機 IndexedDB，未傳送至外部伺服器。
            </p>
            <p>
              雲端登入、帳號刪除及同步功能尚未啟用。設定 Supabase
              環境變數不會自動切換模式。
            </p>
            <button className="text-button" onClick={() => setPrivacy(true)}>
              閱讀完整隱私草稿
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
      {clear && (
        <Confirm
          title="清除所有本機資料？"
          description="紀錄、事件、提醒與設定都會永久清除。建議先匯出備份。"
          action={() => commit(() => emptyData())}
          close={() => setClear(false)}
        />
      )}{" "}
      {imported && (
        <Confirm
          title="以備份取代目前資料？"
          description={`備份包含 ${imported.records.length} 筆數據、${imported.events.length} 個事件與 ${imported.reminders.length} 個提醒、${imported.women.length} 筆女性健康紀錄與 ${imported.care.length} 項保健計畫、${imported.urine.length} 份尿液報告與 ${imported.barthel.length} 筆巴氏評估。確認後取代此瀏覽器的全部資料，不會合併。`}
          action={() => commit(() => imported)}
          close={() => setImported(undefined)}
        />
      )}{" "}
      {privacy && (
        <Modal title="隱私說明（Demo 草稿）" close={() => setPrivacy(false)}>
          <div className="guide">
            <p>SELF-CARE 是個人健康管理工具，不提供醫療診斷。</p>
            <p>
              此版本只使用本機儲存。所有健康數據、偏好與提醒會存在你使用的瀏覽器
              IndexedDB。本機儲存沒有提供應用程式層加密，同裝置及同瀏覽器設定檔可讀取資料。
            </p>
            <p>
              目前不收集分析追蹤，不上傳健康數據。App
              靜態檔案由使用的主機提供，主機可能記錄一般連線資訊。資料可以匯出、取代匯入及完整刪除。
            </p>
            <p>
              請使用範例資料驗證功能。正式上線前仍須完成身份驗證、RLS
              隔離、離線安全、帳號刪除與適用的隱私條款確認。此草稿未宣稱任何法規認證。
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
