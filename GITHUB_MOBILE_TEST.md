# GitHub 上傳與手機測試

目前範圍：免註冊、無雲端資料庫、無自動同步。GitHub Pages 只託管 App 靜態程式，健康紀錄保存在使用者瀏覽器的 IndexedDB。

## 上傳

1. 建立 GitHub repository（建議名稱 `self-care`，一般專案庫，非 `username.github.io`）。
2. 將本資料夾的原始碼放到 repository 根目錄，包含 `.github/workflows/pages.yml`、`package.json`、`package-lock.json`、`public`、`src`、`tests` 及設定檔。不要上傳 node_modules、健康資料 CSV、備份檔、.env 或測試截圖。
3. 使用 `main` 分支；Settings → Pages → Source 選 GitHub Actions。
4. 執行 Deploy SELF-CARE to GitHub Pages workflow；完成後以 Pages 顯示的 HTTPS 網址開啟。
5. 此設定自動使用 repository 名稱作為子路徑，頁面使用 hash 路由，避免重整內頁時 404。自訂網域或 username.github.io 根站需另外調整 base。

官方依據：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## 手機驗收（尚未實機執行）

請先使用虛構資料。依序在 iPhone Safari 與 Android Chrome 記錄手機型號、OS、瀏覽器版本和結果。

- [ ] HTTPS 首次開啟正常，圖示、字體與各頁完整。
- [ ] 加入主畫面後啟動，沒有登入需求。
- [ ] 匯入 CSV 範本：先看預覽、再確認；重新開啟仍有資料。
- [ ] 相同檔案再次匯入不重複；錯誤資料整批不寫入。
- [ ] 尿液 `1.020`、`Trace`、`0-2 /HPF` 保存原文。
- [ ] 匯出加密備份，保存到手機檔案；密碼另行妥善保存。
- [ ] 錯誤密碼無法還原；正確密碼預覽後可取消，確認後才取代全部資料。
- [ ] 將備份手動移到另一手機，還原後核對各類資料、設定及數量。
- [ ] 線上載入一次後開飛航模式，重新啟動、切換頁面、新增及讀取資料。
- [ ] 趨勢 2 年 / 3 年可點；巴氏量表可點選、自動計分；大字級無橫向溢出。
- [ ] 發布下一次更新後出現更新提示，更新後資料仍保留。

## 資料邊界

本機 localhost 與 GitHub Pages 是不同來源，不會自動搬移資料。需要自行匯出備份並在新網址還原。更換瀏覽器、清除網站資料或解除安裝可能影響本機資料，請先備份。加密只作用於備份檔，本機資料庫未加密；提醒為 App 內提醒，尚無關閉 App 後的背景推播。

目前未建立遠端 repository、未上傳、未部署，實機驗收仍待執行。
