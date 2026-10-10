import { z } from "zod";
import { addDays, dateOnly } from "./care";
export const womenKinds = [
  "生理週期",
  "經前症候群",
  "更年期與停經",
  "荷爾蒙相關藥物",
  "偏頭痛",
] as const;
export type WomenKind = (typeof womenKinds)[number];
export type FieldSpec = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select";
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
};
export const womenFields: Record<WomenKind, FieldSpec[]> = {
  生理週期: [
    {
      key: "flow",
      label: "經血量",
      type: "select",
      options: ["未記錄", "點狀", "少量", "中量", "大量"],
    },
    { key: "symptoms", label: "相關症狀", type: "textarea" },
  ],
  經前症候群: [
    { key: "physical", label: "身體症狀", type: "textarea" },
    { key: "mood", label: "情緒變化" },
    { key: "sleep", label: "睡眠狀況" },
    {
      key: "headache",
      label: "頭痛",
      type: "select",
      options: ["未記錄", "無", "有"],
    },
  ],
  更年期與停經: [
    { key: "cycleChange", label: "月經週期變化" },
    { key: "symptoms", label: "更年期症狀", type: "textarea" },
    {
      key: "hotFlashes",
      label: "熱潮紅程度（0–3）",
      type: "number",
      min: 0,
      max: 3,
      step: "1",
    },
    {
      key: "nightSweats",
      label: "夜間盜汗程度（0–3）",
      type: "number",
      min: 0,
      max: 3,
      step: "1",
    },
    {
      key: "sleepScore",
      label: "睡眠困擾程度（0–3）",
      type: "number",
      min: 0,
      max: 3,
      step: "1",
    },
    {
      key: "moodScore",
      label: "情緒困擾程度（0–3）",
      type: "number",
      min: 0,
      max: 3,
      step: "1",
    },
    { key: "lastPeriod", label: "最後一次月經開始日期", type: "date" },
    {
      key: "status",
      label: "停經狀態（自行記錄）",
      type: "select",
      options: ["未確認", "仍有月經", "週期不規則", "已由醫師確認停經"],
    },
  ],
  荷爾蒙相關藥物: [
    { key: "medicine", label: "藥物名稱", required: true },
    { key: "dose", label: "劑量 / 使用方式", required: true },
    {
      key: "action",
      label: "用藥事件",
      type: "select",
      options: ["開始使用", "劑量調整", "換藥", "停藥"],
    },
    { key: "previous", label: "原藥名 / 原劑量" },
    { key: "change", label: "調整、換藥或停藥說明", type: "textarea" },
  ],
  偏頭痛: [
    {
      key: "pain",
      label: "疼痛程度（0–10）",
      type: "number",
      min: 0,
      max: 10,
      step: "1",
      required: true,
    },
    {
      key: "duration",
      label: "持續時間（小時）",
      type: "number",
      min: 0,
      max: 8760,
      step: "0.1",
      required: true,
    },
    { key: "aura", label: "先兆" },
    { key: "accompanying", label: "伴隨症狀", type: "textarea" },
    { key: "acute", label: "急性用藥 / 劑量" },
    { key: "preventive", label: "預防性用藥 / 劑量" },
    { key: "factors", label: "可能影響因子", type: "textarea" },
  ],
};
export const womenSchema = z
  .object({
    id: z.uuid(),
    kind: z.enum(womenKinds),
    at: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }).optional(),
    note: z.string().max(3000),
    details: z.record(z.string(), z.string().max(3000)),
  })
  .superRefine((e, c) => {
    if (e.end && new Date(e.end) < new Date(e.at))
      c.addIssue({ code: "custom", message: "結束時間不可早於開始時間" });
    for (const f of womenFields[e.kind]) {
      const value = e.details[f.key];
      if (f.required && !value?.trim())
        c.addIssue({ code: "custom", message: `請填寫${f.label}` });
      if (!value) continue;
      if (f.type === "date" && !dateOnly.safeParse(value).success)
        c.addIssue({ code: "custom", message: `${f.label}日期無效` });
      if (f.options && !f.options.includes(value))
        c.addIssue({ code: "custom", message: `${f.label}選項無效` });
      if (
        f.type === "number" &&
        (!Number.isFinite(Number(value)) ||
          Number(value) < (f.min ?? -Infinity) ||
          Number(value) > (f.max ?? Infinity) ||
          (f.step === "1" && !Number.isInteger(Number(value))))
      )
        c.addIssue({ code: "custom", message: `${f.label}超出範圍` });
    }
  });
export type WomenEntry = z.infer<typeof womenSchema>;
export function dayOf(at: string) {
  return new Date(Date.parse(at) + 8 * 3600000).toISOString().slice(0, 10);
}
export function cyclePrediction(entries: WomenEntry[], today: string) {
  const days = [
    ...new Set(
      entries
        .filter((e) => e.kind === "生理週期")
        .map((e) => dayOf(e.at))
        .filter((d) => d <= today),
    ),
  ]
    .sort()
    .slice(-7);
  if (days.length < 3) return undefined;
  const gaps = days
    .slice(1)
    .map((d, i) => (Date.parse(d) - Date.parse(days[i])) / 86400000);
  const average = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  return {
    average,
    intervals: gaps.length,
    next: addDays(days[days.length - 1], average),
    shortest: Math.min(...gaps),
    longest: Math.max(...gaps),
  };
}
export function migraineDays(e: WomenEntry) {
  const start = dayOf(e.at),
    end = dayOf(
      new Date(
        Date.parse(e.at) + Number(e.details.duration || 0) * 3600000,
      ).toISOString(),
    );
  const days: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}
export function overlapStats(
  entries: WomenEntry[],
  kind: WomenKind,
  today: string,
) {
  const migraines = new Set(
    entries
      .filter((e) => e.kind === "偏頭痛" && dayOf(e.at) <= today)
      .flatMap(migraineDays)
      .filter((d) => d <= today),
  );
  const observed = new Set<string>();
  for (const e of entries.filter((e) => e.kind === kind)) {
    const start = dayOf(e.at),
      end = e.end ? dayOf(e.end) : start;
    // Limit calendar comparison to the recent year and recorded date spans only.
    for (
      let d = start < addDays(today, -364) ? addDays(today, -364) : start;
      d <= end && d <= today;
      d = addDays(d, 1)
    )
      observed.add(d);
  }
  return {
    observed: observed.size,
    overlap: [...observed].filter((d) => migraines.has(d)).length,
  };
}
