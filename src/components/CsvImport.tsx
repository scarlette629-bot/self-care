import { useState } from "react";
import { Modal } from "./ui";
import { useStore } from "../lib/store";
import { useDefinitions } from "../data/useDefinitions";
import {
  previewCSV,
  measurementKey,
  urineKey,
  type ImportPreview,
} from "../lib/csv";
import { csvCell, download, formatTaipei } from "../lib/model";
import { urineSections } from "../lib/urine";
export function CsvImport({
  mode = "measurements",
  close,
}: {
  mode?: "measurements" | "urine";
  close: () => void;
}) {
  const { data, commit, busy } = useStore();
  const defs = useDefinitions();
  const [preview, setPreview] = useState<ImportPreview>();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [reading, setReading] = useState(false);
  function template() {
    const rows =
      mode === "urine"
        ? [
            [
              "檢查時間",
              "檢驗院所",
              ...urineSections.flatMap((s) => s.fields.map((f) => f[1])),
              "備註",
            ],
            [
              "2026-10-10T08:00:00+08:00",
              "範例院所",
              ...urineSections.flatMap((s) =>
                s.fields.map(([k]) =>
                  k === "gravity" ? "1.020" : k === "protein" ? "陰性" : "",
                ),
              ),
              "範例資料，請替換為報告內容",
            ],
          ]
        : [
            [
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
            ],
            [
              "血壓",
              "118",
              "76",
              "mmHg",
              "2026-10-10T08:00:00+08:00",
              "休息時",
              "",
              "",
              "",
              "範例資料，請替換",
            ],
          ];
    download(
      `SELF-CARE-${mode === "urine" ? "尿液" : "數值"}匯入範本.csv`,
      "\ufeff" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  async function confirm() {
    if (!preview || preview.errors.length) return;
    let count = 0;
    try {
      await commit((b) => {
        const seen = new Set(b.records.map(measurementKey));
        const uSeen = new Set(b.urine.map(urineKey));
        const records = preview.records.filter((r) => {
          const key = measurementKey(r);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const urine = preview.urine.filter((r) => {
          const key = urineKey(r);
          if (uSeen.has(key)) return false;
          uSeen.add(key);
          return true;
        });
        count = records.length + urine.length;
        return {
          ...b,
          records: [...b.records, ...records],
          urine: [...b.urine, ...urine],
        };
      });
      setStatus(`已匯入 ${count} 筆，既有資料保留。`);
      setPreview(undefined);
    } catch {
      setError("未完成匯入，請檢查本機儲存空間後重試。");
    }
  }
  return (
    <Modal
      title={mode === "urine" ? "匯入尿液 CSV" : "匯入數值 CSV"}
      close={close}
    >
      <p className="form-note">
        支援本 App 匯出的 CSV 或下方範本。UTF-8、最多 5 MB / 10,000
        筆。先預覽再確認，有錯誤時整批不寫入。日期未帶時區時採台北時間。
      </p>
      <button className="button secondary" onClick={template}>
        下載 CSV 範本
      </button>
      <label>
        選擇 CSV 檔案
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={reading || busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setPreview(undefined);
            setStatus("");
            setError("");
            setReading(true);
            try {
              if (file.size > 5 * 1024 * 1024)
                throw new Error("CSV 不可超過 5 MB");
              const text = new TextDecoder("utf-8", { fatal: true }).decode(
                await file.arrayBuffer(),
              );
              setPreview(
                previewCSV(text, mode, defs, data.records, data.urine),
              );
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "讀取失敗，請確認為 UTF-8 CSV。",
              );
            } finally {
              setReading(false);
            }
          }}
        />
      </label>
      {reading && <p role="status">正在檢查檔案…</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {status && <p role="status">{status}</p>}
      {preview && (
        <>
          <p role="status">
            共 {preview.total} 筆 · 可新增{" "}
            {preview.records.length + preview.urine.length} 筆 · 重複略過{" "}
            {preview.duplicates} 筆 · 錯誤 {preview.errors.length} 筆
          </p>
          <p className="form-note">
            重複判斷包含指標、時間、結果與備註等完整欄位；同日不同測量不合併。確認前不更動資料。
          </p>
          {preview.errors.length > 0 && (
            <div role="alert" className="error">
              <b>請修正後重新選檔：</b>
              <ul>
                {preview.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
              {preview.errors.length > 20 && (
                <p>尚有 {preview.errors.length - 20} 筆錯誤。</p>
              )}
            </div>
          )}
          <div className="csv-preview">
            {preview.records.slice(0, 10).map((r) => (
              <p key={r.id}>
                {formatTaipei(r.at, "yyyy/MM/dd HH:mm")} ·{" "}
                {defs.find((m) => m.id === r.metricId)?.name} · {r.value}
                {r.secondary !== undefined ? ` / ${r.secondary}` : ""}{" "}
                {defs.find((m) => m.id === r.metricId)?.unit}
              </p>
            ))}
            {preview.urine.slice(0, 10).map((r) => (
              <p key={r.id}>
                {formatTaipei(r.at, "yyyy/MM/dd HH:mm")} ·{" "}
                {r.institution || "未填院所"} ·{" "}
                {Object.values(r.results).filter(Boolean).length} 項結果
              </p>
            ))}
          </div>
        </>
      )}
      <div className="form-actions">
        <button className="button secondary" onClick={close}>
          {status ? "完成" : "取消"}
        </button>
        {preview && (
          <button
            className="button"
            disabled={
              busy ||
              reading ||
              preview.errors.length > 0 ||
              preview.records.length + preview.urine.length === 0
            }
            onClick={() => void confirm()}
          >
            確認匯入
          </button>
        )}
      </div>
    </Modal>
  );
}
