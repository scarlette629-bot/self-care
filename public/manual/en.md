# SELF-CARE User Guide

For version v0.1 · Updated October 11, 2026

SELF-CARE is a personal health log that requires no account. The app interface is currently in Traditional Chinese; this English guide explains the controls. Data stays in the current device and browser and does not automatically sync to another phone. Records and charts do not replace medical diagnosis.

## 1. Open and install

Website: https://scarlette629-bot.github.io/self-care/

- iPhone / iPad: open the website in Safari, then choose Add to Home Screen from the sharing menu. Names and locations may vary by OS version.
- Android: open it in Chrome and choose Install app or Add to Home screen from the browser menu.
- Stay online on the first visit so the page and offline resources can finish loading before testing offline access.
- No registration is needed. A new browser starts without records. Load sample data (載入範例資料) is for practice only; those numbers are not your personal health data.

## 2. Navigation and settings

The bottom bar contains Home (首頁), Data (數據), Trends (趨勢), Reminders (提醒), and My settings (我的). The top-left menu opens laboratory results, women's health, healthy aging, preventive care, and the timeline. The top-right area shows the version and theme switch.

Under My settings, adjust your preferred name, profile, text size, and visible metrics. Press Save personal information (儲存個人資料) after editing profile fields.

## 3. Daily measurements and laboratory results

1. On Home, choose Add record (新增紀錄) or a quick-entry metric.
2. Select the metric and enter its measurement date, value, and relevant notes. Blood pressure requires systolic and diastolic values.
3. If entering a reference interval, use the limits and units printed on that particular report.
4. Press Save record (儲存紀錄). Use the history list in Data to edit or delete records.

Laboratory data (檢驗數據) includes blood counts, glucose, lipids, liver and kidney function, thyroid, electrolytes, nutrition, hormones, and tumor markers, with custom metrics available. A recorded value is not a diagnosis.

### Urinalysis

Open Laboratory data → Urinalysis (尿液檢查) and select Add urine report (＋ 新增尿液報告). Fields are grouped into physical properties, chemical testing, and microscopic sediment. Enter at least one result. Values such as `1.020`, `Trace`, and `0-2 /HPF` are stored as text; transcribe the original report.

## 4. Women's health, aging, and preventive care

- Women's health: record cycles, premenstrual symptoms, menopause observations, hormone medications, migraine, and screening. Comparisons describe recorded events and do not establish causation. Predicted dates are estimates.
- Healthy aging: cognition and memory, daily function, and falls and mobility safety. Daily function uses a 10-question Barthel Index with automatic scoring up to 100 points. Select an answer for every question before saving. Subject description and care arrangements are optional.
- Preventive care: record influenza, shingles, and other vaccines, plus blood tests, dental visits, eye care, health checks, women's screening, and follow-up visits. Enter dates and follow-up plans agreed with your healthcare team.

## 5. Trends and reminders

Trends provides direct buttons for 7, 30, and 90 days, and 1, 2, and 3 years. Additional metrics and date options are in the expandable advanced controls. Two and three years mean rolling windows of 730 and 1,095 days. Switch between chart and table views.

Reminders lets you create tasks and mark them complete. Vaccine and preventive-care plans can also produce pending tasks. **Reminders are currently shown inside the app; background notifications at a scheduled time are not provided when the app is closed.**

## 6. CSV import and export

For numeric measurements, open Data → CSV import (CSV 匯入). For urine reports, use Laboratory data → Import urine CSV (匯入尿液 CSV).

1. Download the appropriate CSV template and keep its column headings. Use UTF-8 encoding.
2. Replace sample rows with your data and select the file.
3. Check the preview counts for new, duplicate, and invalid rows.
4. Once there are no errors, press Confirm import (確認匯入). Previewing alone does not write data.

The limits are 5 MB and 10,000 rows per import. Unknown headings, invalid dates, mismatched units, and invalid numbers must be corrected before the batch can be imported. Units are not automatically converted. Dates without a time zone use Taipei time. Identical content is skipped; distinct measurements on the same date remain separate.

Numeric CSV requires the original headings 指標 (metric), 數值 (value), 單位 (unit), and 日期時間 (date/time). Blood pressure also requires 第二數值 (second value). Create custom metrics before importing them. Urine files use a different template and cannot be substituted for numeric files.

CSV covers numeric measurements and urine reports, not a complete app backup. Use encrypted backup for full transfer. CSV and ordinary JSON exports are not encrypted and should be stored carefully.

## 7. Encrypted backup and transfer

Open My settings → Encrypted backup and device transfer (加密備份與裝置移轉).

### Export

Select Export encrypted backup (匯出加密備份). Enter a password of at least 12 characters twice and select Create encrypted file (建立加密檔案). Keep the downloaded JSON file and password separately. The app neither stores nor recovers the password.

### Restore

Select Restore encrypted backup (還原加密備份), choose the file, enter its password, and select Decrypt and preview (解密並預覽). Review the counts before confirming. **Confirmation replaces the entire local dataset; it does not merge data.** Back up the destination device first. Cancel if you do not want replacement.

An incorrect password, damaged file, or unsupported format prevents restoration. To move devices, manually transfer the encrypted file and restore it with the same password on the destination phone.

The backup uses AES-GCM encryption. **The local database itself is not encrypted.** Device locking and file security remain the user's responsibility.

## 8. Updates and data retention

Continue using the same website address. When New version available (新版本可用) appears, finish or cancel any open form before pressing Update App (更新 App). Updates require connectivity. The update process does not intentionally erase health records; backing up first is recommended.

Version v0.1 removes lettering from the installed icon artwork. Whether an existing home-screen icon updates automatically depends on the OS. If it remains unchanged, back up before trying to add the app to the home screen again. Do not clear website data merely to refresh the icon.

Localhost, another address, another browser, and another device do not share records automatically. Clearing website data, private browsing, or losing a device may make data unrecoverable. Export backups regularly.

## 9. Troubleshooting

- Missing records: check the original address and browser. Restore a backup after changing devices.
- Failed import: check the template, UTF-8 encoding, headings, dates, units, and reported row errors.
- Offline startup fails: open the official website online first, allow offline resources to load, then retry.
- No notification: reminders are in-app only. Use your phone's calendar or alarms for important appointments.
- Reporting an issue: include app version, phone OS, steps, and error text in GitHub Issues. Do not post actual health records, passwords, or backup files publicly.

Source and previous releases: https://github.com/scarlette629-bot/self-care/releases
