# CSV 與加密備份驗證

驗證日期：2026-10-11。測試均使用虛構資料、隔離的瀏覽器環境，未讀取使用者健康資料。

## 已執行

- `npm test`：37 / 37 通過（本次新增 15 項）。
- `npm run lint`：通過。
- `npm run build`：通過。
- `VITE_BASE_PATH=/self-care/ npm run build`：通過；已回復本機根路徑 build。
- `npm run test:e2e -- tests/e2e/import-backup.spec.ts tests/e2e/flows.spec.ts`：14 / 14 通過，桌面與 390px 手機模擬各 7 項。

## 驗證內容

| 功能 | 證據 |
|---|---|
| CSV 語法 | BOM、CRLF、引號、逗號、欄內換行、破損引號、檔案與列數上限單元測試 |
| 數值檢查 | 無效數值、日期、單位、未知指標、缺少第二值拒絕；台北時間與血壓雙值正確 |
| 重複與寫入 | 檔內及既有資料重複略過；錯誤批次確認按鈕停用；有效批次保存與重整後仍存在 |
| 尿液 | 匯入 `1.020` / `Trace`，重整後保留；匯出後再匯入辨識為重複 |
| 備份加密 | AES-GCM 往返相等、每次隨機 salt / IV；錯誤密碼、改動密文、錯誤版本與 IV 拒絕 |
| 備份操作 | 實際下載加密檔、錯誤密碼不進入還原、正確解密預覽、確認取代、重整後資料存在 |
| 回歸 | 紀錄增改刪、趨勢、提醒、設定、manifest、service worker、離線新增 |

測試程式：`tests/import-backup.test.ts`、`tests/e2e/import-backup.spec.ts`、`tests/e2e/flows.spec.ts`。

## 邊界

本次為功能測試，不是獨立安全稽核。加密僅保護備份檔，本機資料未加密。未在真實 iOS / Android 手機操作；GitHub Actions 工作流程尚未在遠端執行。CSV 支援數值型健康 / 檢驗資料與尿液報告，不支援以 CSV 還原女性、疫苗或巴氏量表等結構化紀錄；完整移轉使用加密 JSON 備份。
