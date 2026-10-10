import { useState, type FormEvent } from "react";
import { useStore } from "../lib/store";
import { encryptBackup, decryptBackup } from "../lib/secureBackup";
import { download, type Backup } from "../lib/model";
import { Modal } from "./ui";
import { Confirm } from "./health";
import { useDefinitions } from "../data/useDefinitions";
export function SecureBackup() {
  const { data, commit } = useStore();
  const defs = useDefinitions();
  const [mode, setMode] = useState<"export" | "import">();
  const [file, setFile] = useState<File>();
  const [decoded, setDecoded] = useState<Backup>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  function open(value: "export" | "import") {
    setMode(value);
    setFile(undefined);
    setError("");
    setStatus("");
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    setError("");
    setBusy(true);
    try {
      if (mode === "export") {
        if (password !== f.get("confirm")) throw new Error("兩次密碼不同");
        download(
          "SELF-CARE-encrypted.json",
          JSON.stringify(await encryptBackup(data, password)),
        );
        setMode(undefined);
        setStatus("已匯出加密備份，請自行保存密碼。");
      } else {
        if (!file) throw new Error("請選擇加密備份");
        if (file.size > 30 * 1024 * 1024) throw new Error("檔案超過 30 MB");
        const backup = await decryptBackup(
          JSON.parse(await file.text()),
          password,
        );
        const ids = new Set(
          [...defs.filter((m) => !m.custom), ...backup.custom].map((m) => m.id),
        );
        if (backup.records.some((r) => !ids.has(r.metricId)))
          throw new Error("未知指標");
        setDecoded(backup);
        setMode(undefined);
      }
    } catch (e) {
      setError(
        mode === "export"
          ? e instanceof Error
            ? e.message
            : "匯出失敗"
          : "無法解密：密碼錯誤、備份損毀或格式不支援。資料未更動。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>加密備份與裝置移轉</h2>
      <p className="form-note">
        免註冊。將加密檔案移至另一裝置後，以相同密碼還原。這是手動移轉，不是自動雲端同步；只加密匯出的檔案，本機資料仍未加密。
      </p>
      <div className="row-actions">
        <button className="button secondary" onClick={() => open("export")}>
          匯出加密備份
        </button>
        <button className="button secondary" onClick={() => open("import")}>
          還原加密備份
        </button>
      </div>
      {status && <p role="status">{status}</p>}
      {mode && (
        <Modal
          title={mode === "export" ? "匯出加密備份" : "還原加密備份"}
          close={() => {
            if (!busy) setMode(undefined);
          }}
        >
          <form onSubmit={submit}>
            {mode === "import" && (
              <label>
                加密備份檔案
                <input
                  type="file"
                  accept=".json,application/json"
                  required
                  onChange={(e) => setFile(e.target.files?.[0])}
                />
              </label>
            )}
            <label>
              備份密碼
              <input
                name="password"
                type="password"
                autoComplete={mode === "export" ? "new-password" : "off"}
                minLength={mode === "export" ? 12 : undefined}
                maxLength={1024}
                required
              />
            </label>
            {mode === "export" && (
              <label>
                再次輸入備份密碼
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  maxLength={1024}
                />
              </label>
            )}
            <p className="form-note">
              密碼不會保存，也無法代為找回。請勿使用與其他服務相同的密碼。AES-GCM
              加密；若檔案被修改，解密會失敗。
            </p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button className="button" disabled={busy}>
                {busy
                  ? "處理中…"
                  : mode === "export"
                    ? "建立加密檔案"
                    : "解密並預覽"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {decoded && (
        <Confirm
          title="以解密備份取代本機資料？"
          description={`包含 ${decoded.records.length} 筆數據、${decoded.urine.length} 份尿液報告、${decoded.barthel.length} 筆巴氏評估、${decoded.women.length} 筆女性紀錄與 ${decoded.care.length} 項保健計畫。確認後整份取代，不合併；建議先匯出本機備份。`}
          close={() => setDecoded(undefined)}
          action={async () => {
            await commit(() => decoded);
            setStatus("已還原加密備份。");
          }}
        />
      )}
    </section>
  );
}
