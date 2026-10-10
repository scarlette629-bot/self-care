import { it, expect } from "vitest";
import { barthelItems, barthelSchema, barthelTotal } from "../src/lib/barthel";
import { urineSchema } from "../src/lib/urine";
import { backupSchema } from "../src/lib/model";
import { emptyData } from "../src/data/repository";
const base = { id: crypto.randomUUID(), at: "2026-10-10T00:00:00Z", note: "" };
it("巴氏量表完整最高分100，完整最低分0，缺題不計總分", () => {
  expect(barthelTotal({})).toBeUndefined();
  expect(
    barthelTotal(
      Object.fromEntries(barthelItems.map((i) => [i.id, i.options[0][0]])),
    ),
  ).toBe(100);
  expect(
    barthelTotal(Object.fromEntries(barthelItems.map((i) => [i.id, 0]))),
  ).toBe(0);
});
it("巴氏評估不接受缺題、非法分數或混入未知題目", () => {
  const scores = Object.fromEntries(barthelItems.map((i) => [i.id, 0]));
  const r = {
    ...base,
    version: "ntshb-adl-100-v1",
    description: "",
    caregiver: "",
    scores,
  };
  expect(barthelSchema.safeParse(r).success).toBe(true);
  expect(
    barthelSchema.safeParse({ ...r, scores: { ...scores, bathing: 10 } })
      .success,
  ).toBe(false);
  expect(barthelSchema.safeParse({ ...r, scores: {} }).success).toBe(false);
});
it("尿液保存原始文字、範圍、尾端零；空白結果不等同陰性", () => {
  const r = {
    ...base,
    institution: "",
    results: { gravity: "1.020", rbc: "0-2 /HPF", protein: "Trace" },
  };
  expect(urineSchema.parse(r).results).toEqual(r.results);
  expect(
    urineSchema.safeParse({ ...r, results: { protein: "  " } }).success,
  ).toBe(false);
});
it("舊備份相容，新增陣列識別碼驗證", () => {
  const b = { ...emptyData(), urine: undefined, barthel: undefined };
  expect(backupSchema.parse(b).urine).toEqual([]);
  expect(backupSchema.parse(b).barthel).toEqual([]);
  const r = { ...base, institution: "", results: { protein: "陰性" } };
  expect(backupSchema.safeParse({ ...b, urine: [r, r] }).success).toBe(false);
});
