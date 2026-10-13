# v0.6 個人化健康首頁與檢驗異常提醒

## 版本與範圍

- 基底：main / `07a54cb825162561484dca2f7af6930cfb07e169`（v0.5）。
- 功能分支：`feature/personalized-health-dashboard`。
- 只建立功能分支與 Pull Request；未合併 main、未新增 Release/tag、未部署正式版。

## 新增功能

1. 日常健康、自訂健康指標及檢驗項目在卡片與歷史列表提供「加入首頁」，我的設定也可統一管理。取消只修改偏好，不修改紀錄。
2. 首頁顯示全部所選項目的最新數值、單位、完整日期及適用的檢驗狀態，點擊可前往指標詳細紀錄。
3. 首頁趨勢可切換所有既有及自訂數值指標，提供 7 天、30 天、90 天、1 年、全部，保存最後指標與期間。無資料顯示「尚無健康紀錄」。
4. 各項最新檢驗異常顯示於首頁摘要；檢驗卡片、列表、趨勢資料點、提示及可展開原始資料表使用相同判讀。
5. 正常為綠色 ✓、偏高為橘色 ↑ H、偏低為藍色 ↓ L、危急為紅色 ! Critical、未判定為灰色 ?。顏色附文字及圖示。
6. 修正 GitHub Pages Hash 路由的指標參數讀取，確保首頁卡片可連到對應檢驗或日常紀錄。

## 判讀依據與限制

- 只讀取每筆紀錄的 `low`、`high`、`lowExclusive`、`highExclusive`。不以通用參考資料庫偷偷補值。
- 支援單側上下限與不含等於的邊界；無區間、無效區間或無效數值為未判定。
- 檢驗圖表使用每筆原始值，避免每日平均掩蓋異常；日常健康保留既有每日平均趨勢。
- 危急值政策與報告參考區間分開，須包含指標、單位、門檻、審核人、審核日期及來源。
- 本案未提供經審核危急值門檻，正式程式的政策清單為空。一般偏高／偏低不會自動變成 Critical。測試中的合成門檻只驗證分流規則，未作為醫療門檻上線。
- 首頁異常摘要看各指標最新報告，歷史異常仍可在列表與趨勢查看；未判定不被當成正常。

## 資料與 PWA 相容性

- 新增可選設定欄位：`homeMetricIds`、`homeTrendMetric`、`homeTrendDays`。
- 沒有新設定的舊備份／舊資料，沿用原本非隱藏日常指標前四項；首次選擇後保存完整多選清單。空陣列代表明確不顯示任何卡片。
- 保留舊 `hidden` 欄位、所有紀錄 ID 與 Backup version 1。
- IndexedDB 名稱 `self-care-demo-v1`、version 1、`snapshots/demo` 維持不變。不需要資料遷移或清除儲存空間。
- 新設定與 JSON／加密備份一起保存。CSV 格式、匯入、去重與匯出流程維持相容。
- 保留 PWA `prompt` 更新策略、原來來源及 scope；新建置使用內容雜湊靜態資源與更新後的 precache manifest。未新增清除 IndexedDB/localStorage 的程式。

## 修改檔案

| 類別 | 檔案 |
|---|---|
| 偏好與判讀 | `src/lib/dashboard.ts`、`src/lib/labStatus.ts`、`src/lib/model.ts` |
| 共用介面 | `src/components/HomeMetricToggle.tsx`、`src/components/LabStatusBadge.tsx`、`src/components/health.tsx`、`src/components/TrendChart.tsx` |
| 畫面 | `src/features/Dashboard.tsx`、`src/features/DataPage.tsx`、`src/features/Profile.tsx`、`src/features/Trends.tsx`、`src/styles.css` |
| 版本 | `src/lib/version.ts`、`package.json`、`package-lock.json`、`RELEASE_NOTES.md` |
| 驗證 | `tests/personalized-dashboard.test.ts`、`tests/e2e/personalized-dashboard.spec.ts`、`tests/e2e/dashboard-upgrade.spec.ts`、`tests/e2e/barthel-layout.spec.ts` |
| 說明 | `PERSONALIZED_HEALTH_DASHBOARD.md` |

## 測試結果

- `npm run lint`、`npm run typecheck`、`npm run build`：PASS。
- `npm test`：6 個檔案、48 項單元測試通過；包含新設定相容性、取消不刪資料、最新日期選取、單側參考區間、精確邊界、未判定與危急值分流。
- 瀏覽器測試：桌面 1440×1000、手機 390×844（Chrome 觸控／行動模擬），另有 360／390／430 px 既有版面檢查。
- 完整回歸首次執行共 50 案例；修正舊版號斷言、圖表無障礙語意、Hash 路由同步與升級測試伺服器後，依影響範圍分批重驗。
- 最終受影響範圍重驗 20 項全部通過（桌面 10、手機 10）；前一批修正後的版面／既有流程／首頁驗證另有 20 項通過。分批驗證累計 46 個不同瀏覽器案例已通過，4 項條件式略過。
- 4 項條件式略過：2 項手機專用測試在桌面專案略過；v0.1→v0.2 的歷史升級測試因未提供該舊版 Release 建置而在兩個專案略過。此次另有 v0.5→v0.6 專用升級驗證。

| 本次要求 | 驗證方式 | 結果 |
|---|---|---|
| 日常健康加入首頁 | 勾選步數，多項卡片同步 | PASS |
| 自訂健康指標加入首頁 | 建立「伸展分鐘」並選取；含紀錄自訂指標顯示最新值 | PASS |
| 檢驗加入首頁 | LDL-C 最新值 155、單位、日期、H；直接進入歷史列表 | PASS |
| 取消不刪資料 | 取消 LDL-C、清空首頁選項，完整比對紀錄與 ID | PASS |
| 首頁同步 | 同時顯示 7 張卡片，取消後 6 張，重新載入維持 | PASS |
| 趨勢切換 | 所有來源指標、五種期間、最後選項與空資料訊息 | PASS |
| 異常判讀與顏色 | 同一份報告在摘要／列表／圖表一致；CSS 顏色與資料點檢查 | PASS |
| PWA 重新開啟保留設定 | 舊版同來源快取更新、原始資料快照比對、新設定後離線 reload | PASS |
| CSV 相容 | 原始數值／區間匯出再匯入去重，另保留尿液 CSV 及加密備份回歸 | PASS |
| 手機與桌面 | 實際瀏覽器操作、無水平溢位、螢幕截圖檢視 | PASS |

【未驗證】尚未在實體 iPhone Safari／Android 安裝的獨立 PWA 上操作；上述手機驗證為 Chrome 模擬，不能替代真機驗收。

## 驗收與下一步

Pull Request 審查通過後，仍需使用者明確確認才能合併或部署。若要啟用危急值判讀，另行提供經審核且符合機構／檢驗方法／單位／適用條件的門檻，不用一般異常值取代。
