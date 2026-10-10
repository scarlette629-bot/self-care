import { describe, it, expect } from "vitest";
import {
  dailyPoints,
  backupSchema,
  recordSchema,
  eventSchema,
  withinDays,
  reportStatus,
  bmi,
  csvCell,
  localInput,
} from "../src/lib/model";
import { emptyData } from "../src/data/repository";
const r = {
  id: "a65578fe-e6ad-4ac6-a580-01c2f5887879",
  metricId: "tc",
  value: 220,
  at: "2026-10-10T00:00:00Z",
  context: "",
  note: "",
  institution: "",
  source: "demo-local" as const,
};
describe("健康資料邏輯", () => {
  it("參考區間依當次報告，不以單一固定範圍判定", () => {
    expect(reportStatus({ ...r, high: 200 })).toBe("超出本次報告參考區間");
    expect(reportStatus({ ...r, high: 240 })).toBe("—");
    expect(reportStatus(r)).toBe("—");
  });
  it("上下限含邊界，零值不是缺漏", () => {
    expect(reportStatus({ ...r, value: 0, low: 0, high: 1 })).toBe("—");
    expect(recordSchema.safeParse({ ...r, value: null }).success).toBe(false);
    expect(recordSchema.safeParse({ ...r, value: 0 }).success).toBe(true);
  });
  it("參考區間下限不可大於上限", () =>
    expect(recordSchema.safeParse({ ...r, low: 300, high: 200 }).success).toBe(
      false,
    ));
  it("正確保留血壓雙數值", () =>
    expect(
      recordSchema.parse({ ...r, metricId: "bp", value: 118, secondary: 76 })
        .secondary,
    ).toBe(76));
  it("日期篩選含邊界且排除未來", () => {
    const now = new Date("2026-10-10T00:00:00Z");
    expect(
      withinDays(
        [
          { at: "2026-10-03T00:00:00Z" },
          { at: "2026-10-02T23:59:59Z" },
          { at: "2026-10-11T00:00:00Z" },
        ],
        7,
        now,
      ),
    ).toHaveLength(1);
  });
  it("跨月與跨日事件保留時間，結束不可早於開始", () => {
    const e = {
      id: r.id,
      kind: "偏頭痛",
      title: "觀察",
      at: "2026-09-30T23:00:00+08:00",
      end: "2026-10-01T03:00:00+08:00",
      note: "",
    };
    expect(eventSchema.safeParse(e).success).toBe(true);
    expect(
      eventSchema.safeParse({ ...e, end: "2026-09-29T03:00:00+08:00" }).success,
    ).toBe(false);
  });
  it("同日多次測量採平均、對齊台北日期，缺漏不補零", () => {
    const points = dailyPoints([
      {
        ...r,
        metricId: "bp",
        value: 120,
        secondary: 80,
        at: "2026-10-09T23:00:00Z",
      },
      {
        ...r,
        metricId: "bp",
        value: 110,
        secondary: 70,
        at: "2026-10-10T01:00:00Z",
      },
    ]);
    expect(points).toHaveLength(1);
    expect(points[0].bp).toBe(115);
    expect(points[0]["bp-secondary"]).toBe(75);
    expect(points[0].tc).toBeUndefined();
  });
  it("BMI 使用公分轉公尺", () => expect(bmi(64, 160)).toBeCloseTo(25));
  it("CSV 防止公式注入與引號破壞", () => {
    expect(csvCell('=HYPERLINK("evil")')).toBe('"\'=HYPERLINK(""evil"")"');
    expect(csvCell("abc,def")).toBe('"abc,def"');
  });
  it("備份驗證版本、數值與重複識別碼", () => {
    const b = emptyData();
    expect(backupSchema.safeParse(b).success).toBe(true);
    expect(backupSchema.safeParse({ ...b, version: 2 }).success).toBe(false);
    expect(backupSchema.safeParse({ ...b, records: [r, r] }).success).toBe(
      false,
    );
  });
  it("日期輸入與目前時區轉換可往返", () => {
    const at = "2026-10-09T23:30:00.000Z";
    expect(new Date(localInput(at) + "+08:00").toISOString()).toBe(at);
  });
});
