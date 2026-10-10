import { describe, it, expect } from "vitest";
import {
  careSchema,
  fluStatus,
  careReminders,
  ageDate,
  type CarePlan,
} from "../src/lib/care";
import {
  womenSchema,
  cyclePrediction,
  overlapStats,
  migraineDays,
  type WomenEntry,
} from "../src/lib/women";
import { backupSchema } from "../src/lib/model";
import { emptyData } from "../src/data/repository";
const id = "a65578fe-e6ad-4ac6-a580-01c2f5887879";
const plan: CarePlan = {
  id,
  category: "疫苗管理",
  name: "流感疫苗",
  type: "flu",
  vaccineName: "",
  annualMonth: 10,
  nextDate: "",
  remind: true,
  visits: [],
};
const visit = { id, date: "2026-10-03", clinic: "", result: "", summary: "" };
const cycle = (day: string): WomenEntry => ({
  id: crypto.randomUUID(),
  kind: "生理週期",
  at: day + "T00:00:00+08:00",
  note: "",
  details: {},
});
describe("預防保健與女性健康資料", () => {
  it("舊版備份補上空陣列，不丟棄既有紀錄", () => {
    const old = { ...emptyData(), care: undefined, women: undefined };
    expect(backupSchema.parse(old).care).toEqual([]);
    expect(backupSchema.parse(old).women).toEqual([]);
    expect(
      backupSchema.safeParse({ ...emptyData(), care: [plan, plan] }).success,
    ).toBe(false);
  });
  it("流感完成後轉次年，跨年重新待完成；未來施打紀錄不算已完成", () => {
    const p = { ...plan, visits: [visit] };
    expect(fluStatus(p, "2026-10-01")).toEqual({
      complete: false,
      next: "2026-10-01",
    });
    expect(fluStatus(p, "2026-10-03")).toEqual({
      complete: true,
      next: "2027-10-01",
    });
    expect(fluStatus(p, "2027-01-01")).toEqual({
      complete: false,
      next: "2027-10-01",
    });
    expect(careReminders([{ ...p, remind: false }], "", "2026-10-10")).toEqual(
      [],
    );
  });
  it("帶狀疱疹劑次不可重複、倒置或缺少第 1 劑", () => {
    const p = { ...plan, type: "shingles", visits: [{ ...visit, dose: 2 }] };
    expect(careSchema.safeParse(p).success).toBe(false);
    const first = { ...visit, dose: 1 };
    const second = {
      ...visit,
      id: crypto.randomUUID(),
      date: "2026-10-09",
      dose: 2,
    };
    expect(
      careSchema.safeParse({ ...p, visits: [first, second] }).success,
    ).toBe(true);
    expect(
      careSchema.safeParse({
        ...p,
        visits: [{ ...first, date: "2026-10-10" }, second],
      }).success,
    ).toBe(false);
    expect(
      careSchema.safeParse({
        ...p,
        visits: [first, { ...first, id: crypto.randomUUID() }],
      }).success,
    ).toBe(false);
  });
  it("生日為閏日的自訂年齡提醒與下一劑日期分開，已有施打後不再提醒年齡", () => {
    expect(ageDate("2000-02-29", 50)).toBe("2050-02-28");
    expect(ageDate("", 50)).toBe("");
    const p: CarePlan = {
      ...plan,
      type: "shingles",
      minAge: 50,
      nextDate: "2026-12-10",
    };
    expect(careReminders([p], "1976-10-10", "2026-10-10")).toHaveLength(2);
    expect(
      careReminders(
        [{ ...p, visits: [{ ...visit, dose: 1 }] }],
        "1976-10-10",
        "2026-10-10",
      ),
    ).toHaveLength(1);
  });
  it("週期預估使用最近不同開始日期，資料不足不假設 28 天", () => {
    expect(
      cyclePrediction([cycle("2026-08-01"), cycle("2026-08-29")], "2026-10-10"),
    ).toBeUndefined();
    expect(
      cyclePrediction(
        [
          cycle("2026-08-01"),
          cycle("2026-08-29"),
          cycle("2026-08-29"),
          cycle("2026-09-26"),
          cycle("2026-11-01"),
        ],
        "2026-10-10",
      ),
    ).toMatchObject({ average: 28, intervals: 2, next: "2026-10-24" });
  });
  it("女性欄位驗證時間順序、必要用藥欄位與疼痛範圍", () => {
    const e = cycle("2026-10-10");
    expect(
      womenSchema.safeParse({ ...e, end: "2026-10-09T23:00:00+08:00" }).success,
    ).toBe(false);
    expect(
      womenSchema.safeParse({ ...e, kind: "荷爾蒙相關藥物" }).success,
    ).toBe(false);
    expect(
      womenSchema.safeParse({
        ...e,
        kind: "偏頭痛",
        details: { pain: "11", duration: "2" },
      }).success,
    ).toBe(false);
    expect(
      womenSchema.safeParse({
        ...e,
        kind: "偏頭痛",
        details: { pain: "0", duration: "0" },
      }).success,
    ).toBe(true);
  });
  it("跨午夜發作保留涵蓋日、同日重複發作不重複計日；未記錄日不當成無症狀", () => {
    const c = { ...cycle("2026-10-01"), end: "2026-10-03T18:00:00+08:00" };
    const a: WomenEntry = {
      id,
      kind: "偏頭痛",
      at: "2026-10-02T23:30:00+08:00",
      note: "",
      details: { pain: "7", duration: "2" },
    };
    expect(migraineDays(a)).toEqual(["2026-10-02", "2026-10-03"]);
    expect(
      overlapStats(
        [c, a, { ...a, id: crypto.randomUUID() }],
        "生理週期",
        "2026-10-10",
      ),
    ).toEqual({ observed: 3, overlap: 2 });
    expect(overlapStats([a], "生理週期", "2026-10-10")).toEqual({
      observed: 0,
      overlap: 0,
    });
  });
});
