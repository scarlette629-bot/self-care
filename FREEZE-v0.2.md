# v0.2 凍結紀錄

2026-10-11：經使用者要求，確認後凍結此版本。

- 手機首頁版本旁可見「檢查 App 更新」按鈕。
- 首頁 Demo Mode 整個區塊及範例載入入口已移除。
- 建置、lint、手機更新按鈕與離線提示測試通過。
- 5 項手機主要流程回歸通過；另有手機排版測試通過。
- 實際從封存 v0.1 建置安裝 service worker，新增血壓 123/78，再按更新至 v0.2；畫面可見原紀錄，更新前後 IndexedDB 完整 snapshot 序列化內容相等。測試位於 tests/e2e/version-upgrade.spec.ts，使用 UPGRADE_OLD_DIR 指定舊版建置、dist-upgrade 指定新版建置。

凍結意指保留 v0.2 tag、Release 與下載檔，不移動標籤或覆寫既有版本。後續修改另建新版本。這不是 GitHub 管理者權限層級的不可變儲存鎖定。

驗證為 Chrome 手機尺寸模擬，非 iPhone/Android 實機；不保證使用者自行清除瀏覽器資料後仍可還原。
