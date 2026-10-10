import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const csv =
  "指標,數值,第二數值,單位,日期時間,備註\n血壓,118,76,mmHg,2026-10-10 08:00,CSV驗證";
test("CSV 預覽、拒絕錯誤、保存、重複與加密備份還原", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "CSV 匯入", exact: true }).click();
  const file = page.getByLabel("選擇 CSV 檔案");
  await file.setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv + "\n血壓,abc,76,mmHg,2026-10-10,"),
  });
  await expect(
    page.getByRole("button", { name: "確認匯入", exact: true }),
  ).toBeDisabled();
  await file.setInputFiles({
    name: "valid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(page.getByRole("status")).toContainText("可新增 1 筆");
  await page.getByRole("button", { name: "確認匯入", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已匯入 1 筆");
  await file.setInputFiles({
    name: "same.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(page.getByRole("status")).toContainText("重複略過 1 筆");
  await expect(
    page.getByRole("button", { name: "確認匯入", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.reload();
  await page.goto("/profile");
  await page.getByRole("button", { name: "匯出加密備份", exact: true }).click();
  await page
    .getByLabel("備份密碼", { exact: true })
    .fill("test-only-password-123");
  await page.getByLabel("再次輸入備份密碼").fill("test-only-password-123");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "建立加密檔案" }).click();
  const download = await downloading;
  const bytes = await readFile((await download.path())!);
  expect(bytes.toString()).not.toContain("CSV驗證");
  await page.getByRole("button", { name: "還原加密備份", exact: true }).click();
  await page
    .getByLabel("加密備份檔案")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: bytes,
    });
  await page.getByLabel("備份密碼", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "解密並預覽" }).click();
  await expect(page.getByRole("alert")).toContainText("資料未更動");
  await page
    .getByLabel("備份密碼", { exact: true })
    .fill("test-only-password-123");
  await page.getByRole("button", { name: "解密並預覽" }).click();
  await expect(page.getByRole("dialog")).toContainText("包含 1 筆數據");
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已還原加密備份");
  await page.reload();
  await page.goto("/timeline");
  await expect(page.getByText("血壓 118 / 76 mmHg")).toBeVisible();
});
test("尿液 CSV 匯入與匯出往返保留文字", async ({ page }) => {
  await page.goto("/labs");
  await page.getByRole("button", { name: "匯入尿液 CSV", exact: true }).click();
  await page
    .getByLabel("選擇 CSV 檔案")
    .setInputFiles({
      name: "urine.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "檢查時間,比重 (Specific Gravity),蛋白質 (Protein)\n2026-10-10,1.020,Trace",
      ),
    });
  await page.getByRole("button", { name: "確認匯入", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已匯入 1 筆");
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page.reload();
  await expect(page.getByText("1.020", { exact: true })).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出尿液 CSV", exact: true }).click();
  const bytes = await readFile((await (await downloading).path())!);
  await page.getByRole("button", { name: "匯入尿液 CSV", exact: true }).click();
  await page
    .getByLabel("選擇 CSV 檔案")
    .setInputFiles({ name: "export.csv", mimeType: "text/csv", buffer: bytes });
  await expect(page.getByRole("status")).toContainText("重複略過 1 筆");
});
