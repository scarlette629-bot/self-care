# SELF-CARE 個人健康管理 PWA

目前交付方向：免註冊、本機保存、無雲端資料服務。CSV 匯入與加密備份驗證見 `IMPORT_BACKUP_VERIFICATION.md`；GitHub 上傳與手機測試見 `GITHUB_MOBILE_TEST.md`。以下舊版規劃中涉及帳號或雲端者不屬於本次範圍。

使用附件中的青綠醫療卡片風格與原始 Self-Care logo 建立的可操作本機示範版。不是完整正式醫療資訊產品；下方明確列出交付範圍與待辦。

## 啟動

需要 Node.js 22.12+（本次使用 22.23.3）。

```bash
npm ci
npm run dev
```

正式 PWA 預覽（Service Worker 在 production build 啟用）：

```bash
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 4173
```

開啟 `http://127.0.0.1:4173/`。初次沒有範例數字，自行新增，或點擊首頁「載入範例資料」。所有新增紀錄均為明確標示的本機 Demo 測試資料。

## 手機優先版本更新

新增首頁快速記錄、單欄卡片、可搜尋指標選擇、底部抽屜表單、趨勢進階篩選收合與手機字級設定。細節與驗收範圍見 `MOBILE_UX_CHANGES.md`。

尿液三類 18 項報告、暫停的老化入口及官方巴氏量表點選計分，見 `URINE_ADL_UPDATE.md`。

## 已實作

- 手機底部導覽、桌面 Sidebar、繁體中文、淺深色、手機／桌面字級設定、原始 logo。
- 首頁摘要、四項可選指標、待辦任務、健康模組入口。
- 8 項日常健康指標、37 項檢驗／檢查數值定義；自訂單一數值指標。
- 數據與檢驗完整 CRUD、日期時間（固定台北時間）、情境、備註、雙值血壓、搜尋、日期篩選、歷史列表。
- 當次檢驗參考區間、機構保存；僅標示超出當次區間，不診斷疾病。
- 血壓雙線、每日平均、單指標與同單位血脂四線、7／30／90／180／365／730／1095 天和自訂區間、資料表切換、樣本數。
- 女性健康七個分區：週期及預估、PMS、更年期症狀自評、荷爾蒙用藥事件、偏頭痛專用欄位、共用女性預防保健及交叉觀察。健康老化維持基礎事件日誌。
- 提醒 CRUD、完成／取消完成與實際完成時間、延後一天、今天／待完成／逾時／已完成篩選；獨立預防保健模組提供疫苗與檢查歷程，流感年度提醒、帶狀疱疹劑次與自訂年齡提醒。
- 原始數據與事件衍生的時間軸（不複製源紀錄）、搜尋、類別與期間篩選。
- IndexedDB 持續儲存、儲存失敗提示、CSV 匯出及公式注入防護。
- JSON 全資料備份、版本與欄位驗證、重複 ID 檢查、未知指標拒絕、取代確認、全資料刪除確認。
- PWA manifest、正方形 192/512 icons、maskable icon、Service Worker app shell 快取、離線新增、更新提示、安裝引導。

詳細需求對照、提醒與分析定義見 `STRUCTURED_HEALTH.md`。

## 專案結構

```text
src/
  App.tsx                  路由及應用程式殼層
  features/                首頁、數據、趨勢、提醒、事件、時間軸、設定
  components/Forms.tsx     紀錄／提醒／事件表單
  components/TrendChart.tsx 趨勢呈現
  components/ui.tsx        共用 UI、原生 dialog、空狀態
  data/metrics.ts          通用指標定義
  data/repository.ts       Dexie 本機 repository 與範例產生器
  lib/model.ts             TypeScript／Zod、日期／數據／CSV 工具
  lib/store.ts             Zustand、序列化持久寫入
  styles.css               參考圖設計系統與響應式樣式
supabase/migrations/001_initial.sql
 tests/                    Vitest、Playwright 驗收
```

## 資料庫設計

提供 21 個資料表及 `health_events` security-invoker view，涵蓋個人資料、指標、測量、檢驗、週期、症狀、更年期自評、藥物、偏頭痛、營養、活動、功能、跌倒、保健、提醒與偏好。

每表具 UUID、`user_id`、`created_at`、`updated_at`、RLS；`user_id` 對 `auth.users` 的外鍵刪除 cascade。子紀錄對使用者自建定義採複合 owner 外鍵，防止引用另一帳號的定義。事件時間使用 timestamptz；測量／檢驗具 revision 欄位供後續樂觀鎖定整合。

**Migration 尚未於 Supabase 執行；RLS 尚未以兩帳號實測。前端目前只讀寫 DemoDB，未連上此 schema。**

## 環境變數與正式模式

`.env.example` 列出 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`，可複製為 `.env.local`。禁止放 service-role key。

此版**不會因為填入環境變數就自動切換至雲端模式**。正式模式需依序完成：

1. 在測試 Supabase 專案套用 migration 與種子指標。
2. 完成 Email 註冊／登入／密碼重設、session 與 protected routes。
3. 實作 user-scoped Supabase repository、登出快取清除、多帳號隔離。
4. 離線安全策略、待同步佇列、冪等寫入、revision 衝突提示與人工解決。
5. 雙帳號 RLS integration、帳號刪除 Edge Function 與近期身份驗證。
6. 完成安全與隱私審查後，才允許正式敏感健康資料。

完整且更新的狀態見 `REMAINING_WORK.md`。

## 尚未完成

- Supabase Auth／雲端 CRUD／同步／衝突處理／帳號刪除。
- 老化專用完整欄位、正式授權量表、女性健康的進階統計分析與醫療驗證（目前為描述性日期交叉觀察）。
- 睡眠入睡／起床／品質及量測情境自訂，單位偏好與換算 UI。
- 自訂指標刪除、非數值資料類型、首頁拖曳排序與完整模組隱藏。
- CSV 檢驗匯入、散點／長條／熱度圖、跨單位雙軸、事件標記與圖上參考帶。
- 流感以外的自訂週期 recurrence、通知權限 UI、Push API 與後端排程（目前依使用者填寫下次日期提醒）。
- React Hook Form、TanStack Query、Tailwind／shadcn 及集中 i18n 尚未整合；已安裝的部分套件供後續階段，不宣稱已使用。現階段使用原生表單、Zod、CSS。
- 真實 Android／iOS 安裝、WCAG AA audit、完整安全審查與 Vercel 正式部署。

## 驗證

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

E2E 使用系統 Chrome（`channel: 'chrome'`）。未安裝 Chrome 的環境可移除 channel 並執行 `npx playwright install chromium`。

測試涵蓋 CRUD 持久化、資料／圖表／時間軸一致性、提醒完成與偏好、手機水平溢位、manifest／service worker／離線新增；另有數據邏輯、缺漏／零值、參考區間、日期邊界、跨日、備份及 CSV 測試。最終結果見 `TEST_RESULTS.md`。

PWA 人工驗收：正式 build 預覽 → 確認 Application 面板的 Manifest / Service Worker → 安裝 → 切離線 → 新增紀錄 → 重啟驗證 → 回連線（仍是本機資料，不會雲端同步）。iOS 與 Android 安裝仍需真機測試。

## Vercel 部署說明

本次未建立外部專案或部署。可部署至 Vercel：Framework Vite、Build `npm run build`、Output `dist`。`vercel.json` 提供 SPA rewrite；使用 HTTPS 驗證安裝與 Service Worker。先用範例測試，不輸入正式敏感健康資料。

## 隱私取捨

本機資料未加密。相同裝置、相同瀏覽器設定檔可能存取全部 Demo 資料；不存在多帳號隔離。沒有第三方 analytics。瀏覽器清除資料會失去紀錄，請自行備份。本產品不提供診斷，不以範例數值作醫療建議。
