import { barthelSchema } from "./barthel";
import { urineSchema } from "./urine";
import { z } from "zod";
import { careSchema } from "./care";
import { womenSchema } from "./women";
import { format, type FormatOptions } from "date-fns";
export type Metric = {
  id: string;
  name: string;
  english: string;
  unit: string;
  group: string;
  icon: string;
  color: string;
  secondary?: string;
  custom?: boolean;
};
export const recordSchema = z
  .object({
    id: z.uuid(),
    metricId: z.string().min(1),
    value: z.number().finite(),
    secondary: z.number().finite().optional(),
    at: z.iso.datetime({ offset: true }),
    context: z.string().max(120),
    note: z.string().max(2000),
    low: z.number().finite().optional(),
    high: z.number().finite().optional(),
    lowExclusive: z.boolean().optional(),
    highExclusive: z.boolean().optional(),
    institution: z.string().max(200),
    source: z.literal("demo-local"),
  })
  .refine(
    (r) => r.low === undefined || r.high === undefined || r.low <= r.high,
    { message: "參考區間下限不可大於上限" },
  )
  .superRefine((r, c) => {
    if (
      r.metricId === "bp" &&
      (r.secondary === undefined || r.secondary < 0 || r.secondary > r.value)
    )
      c.addIssue({ code: "custom", message: "血壓必須包含合理的雙數值" });
    if (
      [
        "bp",
        "heart",
        "glucose",
        "weight",
        "oxygen",
        "temp",
        "sleep",
        "steps",
      ].includes(r.metricId) &&
      r.value < 0
    )
      c.addIssue({ code: "custom", message: "日常指標不可為負值" });
    if (r.metricId === "oxygen" && r.value > 100)
      c.addIssue({ code: "custom", message: "血氧不可大於100%" });
  });
export type HealthRecord = z.infer<typeof recordSchema>;
export const reminderSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(150),
  category: z.string(),
  at: z.iso.datetime({ offset: true }),
  done: z.boolean(),
  completedAt: z.iso.datetime({ offset: true }).optional(),
  note: z.string().max(2000),
});
export type Reminder = z.infer<typeof reminderSchema>;
export const eventSchema = z
  .object({
    id: z.uuid(),
    kind: z.string(),
    title: z.string().trim().min(1).max(150),
    at: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }).optional(),
    severity: z.number().min(0).max(10).optional(),
    note: z.string().max(3000),
  })
  .refine((e) => !e.end || new Date(e.end) >= new Date(e.at), {
    message: "結束時間不可早於開始時間",
  });
export type HealthEvent = z.infer<typeof eventSchema>;
export const settingsSchema = z.object({
  nickname: z.string().max(50),
  height: z.number().positive().optional(),
  birthdate: z.string(),
  dark: z.boolean(),
  font: z.number().min(0.9).max(1.3),
  hidden: z.array(z.string()),
  timezone: z.literal("Asia/Taipei"),
});
export type Settings = z.infer<typeof settingsSchema>;
export const metricSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(50),
  english: z.string(),
  unit: z.string().max(30),
  group: z.string(),
  icon: z.string(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondary: z.string().optional(),
  custom: z.boolean().optional(),
});
export const backupSchema = z
  .object({
    version: z.literal(1),
    barthel: z.array(barthelSchema).max(10000).default([]),
    urine: z.array(urineSchema).max(10000).default([]),
    care: z.array(careSchema).max(10000).default([]),
    women: z.array(womenSchema).max(50000).default([]),
    records: z.array(recordSchema).max(50000),
    reminders: z.array(reminderSchema).max(10000),
    events: z.array(eventSchema).max(50000),
    custom: z.array(metricSchema).max(200),
    settings: settingsSchema,
  })
  .superRefine((b, c) => {
    for (const key of [
      "records",
      "reminders",
      "events",
      "custom",
      "care",
      "women",
      "urine",
      "barthel",
    ] as const) {
      if (new Set(b[key].map((x) => x.id)).size !== b[key].length)
        c.addIssue({
          code: "custom",
          message: "備份含重複識別碼",
          path: [key],
        });
    }
  });
export type Backup = z.infer<typeof backupSchema>;
export function reportStatus(r: HealthRecord) {
  return (r.low !== undefined && (r.lowExclusive ? r.value <= r.low : r.value < r.low)) ||
    (r.high !== undefined && (r.highExclusive ? r.value >= r.high : r.value > r.high))
    ? "超出本次報告參考區間"
    : "—";
}
export function formatValue(r: HealthRecord, m: Metric) {
  return `${r.value}${m.secondary ? ` / ${r.secondary ?? "—"}` : ""}`;
}
export function withinDays<T extends { at: string }>(
  rows: T[],
  days: number,
  now = new Date(),
) {
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return rows
    .filter((r) => new Date(r.at) >= start && new Date(r.at) <= now)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
export function bmi(weight: number, height: number) {
  return weight / (height / 100) ** 2;
}
export function csvCell(x: unknown) {
  let s = String(x ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function taipeiDay(at: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}
export function localInput(at = new Date().toISOString()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(at))
    .replace(" ", "T");
}
export function formatTaipei(
  at: string | Date,
  pattern: string,
  options?: FormatOptions,
) {
  const instant = new Date(at);
  const local = new Date(instant.getTime() + 8 * 3600000);
  const wall = new Date(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
    local.getUTCHours(),
    local.getUTCMinutes(),
    local.getUTCSeconds(),
  );
  return format(wall, pattern, options);
}

// Daily averages align same-unit series without overwriting simultaneous observations.
export function dailyPoints(rows: HealthRecord[]) {
  const days = new Map<string, Map<string, number[]>>();
  for (const r of rows) {
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(r.at));
    const values = days.get(day) ?? new Map<string, number[]>();
    values.set(r.metricId, [...(values.get(r.metricId) ?? []), r.value]);
    if (r.secondary !== undefined)
      values.set(r.metricId + "-secondary", [
        ...(values.get(r.metricId + "-secondary") ?? []),
        r.secondary,
      ]);
    days.set(day, values);
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, values]) => {
      const point: Record<string, string | number> = {
        at: day + "T00:00:00+08:00",
      };
      for (const [key, list] of values)
        point[key] = Number(
          (list.reduce((a, b) => a + b, 0) / list.length).toFixed(3),
        );
      return point;
    });
}
