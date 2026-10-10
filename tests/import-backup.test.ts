import { describe, it, expect } from "vitest";
import { parseCSV, previewCSV } from "../src/lib/csv";
import { encryptBackup, decryptBackup } from "../src/lib/secureBackup";
import { emptyData } from "../src/data/repository";
import { metrics } from "../src/data/metrics";
const header = "指標,數值,第二數值,單位,日期時間,備註";
const row = "血壓,118,76,mmHg,2026-10-10 08:00,測試";
const preview = (s: string) => previewCSV(s, "measurements", metrics, [], []);
describe("CSV 匯入", () => {
  it("BOM、CRLF、引號、逗號及換行", () =>
    expect(parseCSV('\ufeffa,b\r\n"一,二","換\n行"\r\n')).toEqual([
      ["a", "b"],
      ["一,二", "換\n行"],
    ]));
  it.each(['a,b\n"未結束,b', 'a,b\n"a"x,b', 'a,b\na"b,c'])(
    "拒絕破損引號 %s",
    (s) => expect(() => parseCSV(s)).toThrow(),
  );
  it("血壓雙值、台北時間與檔內及既有重複", () => {
    const p = preview(header + "\n" + row + "\n" + row);
    expect(p.errors).toEqual([]);
    expect(p.duplicates).toBe(1);
    expect(p.records[0]).toMatchObject({
      value: 118,
      secondary: 76,
      at: "2026-10-10T00:00:00.000Z",
    });
    expect(
      previewCSV(header + "\n" + row, "measurements", metrics, p.records, [])
        .duplicates,
    ).toBe(1);
  });
  it.each([
    "血壓,118,,mmHg,2026-10-10,",
    "血壓,abc,76,mmHg,2026-10-10,",
    "血壓,118,76,kPa,2026-10-10,",
    "血壓,118,76,mmHg,2026-02-30,",
    "未知,118,76,mmHg,2026-10-10,",
  ])("拒絕無效數值、日期、單位或指標 %s", (r) =>
    expect(preview(header + "\n" + r).errors).toHaveLength(1),
  );
  it("缺標題與重複標題", () => {
    expect(() => preview("a,b\n1,2")).toThrow();
    expect(() => preview(header + ",指標\n" + row + ",血壓")).toThrow();
  });
  it("尿液保留小數尾零與文字", () => {
    const p = previewCSV(
      "檢查時間,比重 (Specific Gravity),蛋白質 (Protein)\n2026-10-10,1.020,Trace",
      "urine",
      metrics,
      [],
      [],
    );
    expect(p.errors).toEqual([]);
    expect(p.urine[0].results).toMatchObject({
      gravity: "1.020",
      protein: "Trace",
    });
  });
  it("檔案及列數上限", () => {
    expect(() => parseCSV("a".repeat(5 * 1024 * 1024 + 1))).toThrow();
    expect(() => parseCSV("a\n" + "1\n".repeat(10001))).toThrow();
  });
});
describe("加密備份", () => {
  const password = "測試專用密碼-123456789";
  it("完整往返、隨機 salt/IV、不含明文、錯誤密碼與篡改拒絕", async () => {
    const original = {
      ...emptyData(),
      records: preview(header + "\n" + row).records,
    };
    const a = await encryptBackup(original, password),
      b = await encryptBackup(original, password);
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    expect(a.data).not.toBe(b.data);
    expect(JSON.stringify(a)).not.toContain("測試");
    expect(await decryptBackup(a, password)).toEqual(original);
    await expect(decryptBackup(a, "wrong-password")).rejects.toThrow();
    await expect(
      decryptBackup(
        { ...a, data: (a.data[0] === "A" ? "B" : "A") + a.data.slice(1) },
        password,
      ),
    ).rejects.toThrow();
    await expect(
      decryptBackup({ ...a, version: 2 }, password),
    ).rejects.toThrow();
    await expect(
      decryptBackup({ ...a, iv: "AA==" }, password),
    ).rejects.toThrow();
  });
  it("拒絕短密碼", async () =>
    await expect(encryptBackup(emptyData(), "short")).rejects.toThrow());
});
