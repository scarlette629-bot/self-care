# 版本保存與更新規則

正式網站使用固定 GitHub Pages 網址與 main 分支，讓現有安裝者維持同一來源及 IndexedDB 資料。

每次發版：
1. 在原有 Git 歷史上新增提交，不 force push、不重建 repository。
2. 更新 src/lib/version.ts、package.json 與 RELEASE_NOTES.md。
3. 完成驗證後，建立新的 annotated tag（首版 v0.0，後續 v0.1、v0.2 等），不得移動或刪除已發布 tag。
4. 推送 main 與新 tag。main 觸發 Pages 部署；tag 觸發獨立 Release，保存該版原始碼 ZIP 與可部署網站 ZIP。
5. Release workflow 不使用覆蓋參數；既有 Release 不重寫。
6. 用已安裝的舊版確認新版提示、按「更新 App」及資料保留，再記錄驗收結果。

版本歷史保存於 Git commit、tag 與 Release。正式網站呈現最新版，不為每版改用不同網址。未設定 GitHub ruleset 前，管理者仍有權手動修改或刪除 tag；此流程不是不可變儲存保證。

資料變更必須向後相容或提供經測試的 migration，不得透過清除 IndexedDB 更新 App。更新需連線；瀏覽器檢查 service worker 後才會出現提示，並非保證即時推送。
