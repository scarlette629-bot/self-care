import { z } from "zod";

export const dateOnly = z.iso.date();
const optionalDate = z.union([dateOnly, z.literal("")]).default("");
export const careCategories = [
  "疫苗管理",
  "定期抽血",
  "牙科 / 洗牙",
  "視力 / 眼科",
  "健康檢查",
  "女性預防保健",
  "回診追蹤",
] as const;
export const visitSchema = z.object({
  id: z.uuid(),
  date: dateOnly,
  clinic: z.string().max(200),
  result: z.string().max(1000),
  summary: z.string().max(3000),
  dose: z.number().int().min(1).max(99).optional(),
});
export const careSchema = z
  .object({
    id: z.uuid(),
    category: z.enum(careCategories),
    name: z.string().trim().min(1).max(100),
    type: z.enum(["flu", "shingles", "vaccine", "check"]),
    vaccineName: z.string().max(150),
    annualMonth: z.number().int().min(1).max(12).default(10),
    minAge: z.number().int().min(0).max(120).optional(),
    nextDate: optionalDate,
    remind: z.boolean(),
    visits: z.array(visitSchema).max(1000),
  })
  .superRefine((p, ctx) => {
    if (new Set(p.visits.map((v) => v.id)).size !== p.visits.length)
      ctx.addIssue({ code: "custom", message: "檢查紀錄識別碼重複" });
    if (p.type === "shingles") {
      const first = p.visits.filter((v) => v.dose === 1),
        second = p.visits.filter((v) => v.dose === 2);
      if (
        first.length > 1 ||
        second.length > 1 ||
        p.visits.some((v) => !v.dose || v.dose > 2)
      )
        ctx.addIssue({
          code: "custom",
          message: "帶狀疱疹疫苗請分別記錄第 1、2 劑，勿重複劑次",
        });
      if (second.length && (!first.length || second[0].date < first[0].date))
        ctx.addIssue({
          code: "custom",
          message: "請先填寫第 1 劑，第 2 劑日期不可早於第 1 劑",
        });
    }
  });
export type CarePlan = z.infer<typeof careSchema>;
export type CareVisit = z.infer<typeof visitSchema>;
export function addDays(day: string, days: number) {
  return new Date(Date.parse(day + "T00:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function ageDate(birthdate: string, age: number) {
  if (!dateOnly.safeParse(birthdate).success) return "";
  const year = Number(birthdate.slice(0, 4)) + age;
  const prefix = `${year}${birthdate.slice(4)}`;
  return dateOnly.safeParse(prefix).success ? prefix : `${year}-02-28`;
}
export function fluStatus(plan: CarePlan, today: string) {
  const year = Number(today.slice(0, 4));
  const complete = plan.visits.some(
    (v) => v.date.startsWith(String(year)) && v.date <= today,
  );
  return {
    complete,
    next: `${year + (complete ? 1 : 0)}-${String(plan.annualMonth).padStart(2, "0")}-01`,
  };
}
export function careReminders(
  plans: CarePlan[],
  birthdate: string,
  today: string,
) {
  return plans
    .flatMap((p) => {
      if (!p.remind) return [];
      const result: {
        id: string;
        planId: string;
        name: string;
        day: string;
      }[] = [];
      if (p.type === "flu")
        result.push({
          id: p.id + "-annual",
          planId: p.id,
          name: p.name + " · 年度提醒",
          day: fluStatus(p, today).next,
        });
      else if (p.nextDate)
        result.push({
          id: p.id + "-next",
          planId: p.id,
          name: p.name + " · 下次追蹤",
          day: p.nextDate,
        });
      if (p.type === "shingles" && p.minAge !== undefined && !p.visits.length) {
        const day = ageDate(birthdate, p.minAge);
        if (day)
          result.push({
            id: p.id + "-age",
            planId: p.id,
            name: `${p.name} · 自訂 ${p.minAge} 歲提醒`,
            day,
          });
      }
      return result;
    })
    .sort((a, b) => a.day.localeCompare(b.day));
}
