import { describe, expect, it } from "vitest";
import { emptyData } from "../src/data/repository";
import { metrics } from "../src/data/metrics";
import { backupSchema, type HealthRecord } from "../src/lib/model";
import {
  homeMetricIds,
  latestRecords,
  selectHomeMetric,
} from "../src/lib/dashboard";
import { labStatus, type ReviewedCriticalPolicy } from "../src/lib/labStatus";
const record: HealthRecord = {
  id: "11000000-0000-4000-8000-000000000001",
  metricId: "ldl",
  value: 120,
  at: "2026-10-14T08:00:00+08:00",
  context: "",
  note: "",
  institution: "",
  source: "demo-local",
};
describe("home preferences and legacy compatibility", () => {
  it("retains old first four non-hidden daily metrics until a preference is saved", () => {
    const b = emptyData();
    b.settings.hidden = ["heart"];
    const parsed = backupSchema.parse(b);
    expect(parsed.settings.homeMetricIds).toBeUndefined();
    expect(homeMetricIds(parsed.settings, metrics)).toEqual([
      "bp",
      "glucose",
      "weight",
      "oxygen",
    ]);
  });
  it("allows multiple daily/custom/lab cards, preserves all data and explicit empty selection", () => {
    const b = emptyData();
    b.records = [record];
    const custom = {
      ...metrics[0],
      id: "custom-health",
      name: "我的指標",
      secondary: undefined,
      custom: true,
    };
    b.custom = [custom];
    b.settings.homeMetricIds = [];
    const defs = [...metrics, custom];
    let selected = selectHomeMetric(b, defs, "ldl", true);
    selected = selectHomeMetric(selected, defs, custom.id, true);
    selected = selectHomeMetric(selected, defs, "steps", true);
    selected = selectHomeMetric(selected, defs, "ldl", true);
    expect(homeMetricIds(selected.settings, defs)).toEqual([
      "ldl",
      custom.id,
      "steps",
    ]);
    for (const id of ["ldl", custom.id, "steps"])
      selected = selectHomeMetric(selected, defs, id, false);
    expect(homeMetricIds(backupSchema.parse(selected).settings, defs)).toEqual(
      [],
    );
    expect(selected.records).toBe(b.records);
    expect(selected.custom).toBe(b.custom);
    expect(selected.records[0].id).toBe(record.id);
  });
  it("uses actual latest timestamp without modifying rows", () => {
    const previous = { ...record, value: 90, at: "2026-10-13T08:00:00+08:00" };
    const rows = [record, previous];
    expect(latestRecords(rows).get("ldl")).toBe(record);
    expect(rows).toEqual([record, previous]);
  });
  it("round-trips trend selection and settings through backups without a database version change", () => {
    const b = emptyData();
    b.records = [record];
    b.settings.homeMetricIds = ["ldl"];
    b.settings.homeTrendMetric = "ldl";
    b.settings.homeTrendDays = 0;
    expect(backupSchema.parse(JSON.parse(JSON.stringify(b)))).toEqual(b);
  });
});
describe("report-specific classification", () => {
  it("requires applicable report limits instead of a catalog fallback", () => {
    expect(labStatus(record)).toBe("unknown");
    expect(labStatus({ ...record, low: 0, high: 120 })).toBe("normal");
    expect(labStatus({ ...record, high: 119 })).toBe("high");
    expect(labStatus({ ...record, low: 121 })).toBe("low");
    expect(labStatus({ ...record, low: 0 })).toBe("normal");
    expect(labStatus({ ...record, low: 121, high: 119 })).toBe("unknown");
    expect(labStatus({ ...record, value: NaN, high: 120 })).toBe("unknown");
  });
  it("respects exact inclusive/exclusive and one-sided boundaries", () => {
    expect(labStatus({ ...record, high: 120, highExclusive: true })).toBe(
      "high",
    );
    expect(labStatus({ ...record, low: 120, lowExclusive: true })).toBe("low");
    expect(labStatus({ ...record, low: 120 })).toBe("normal");
    expect(labStatus({ ...record, value: 0, low: 0, high: 1 })).toBe("normal");
    expect(
      labStatus({ ...record, low: 120, high: 120, highExclusive: true }),
    ).toBe("unknown");
  });
  it("does not escalate ordinary abnormal results into critical values", () => {
    const m = metrics.find((m) => m.id === "ldl")!;
    expect(labStatus({ ...record, value: 99999, high: 120 }, m)).toBe("high");
    // Synthetic test-only policy, not a medical limit or shipped configuration.
    const policy: ReviewedCriticalPolicy = {
      metricId: "ldl",
      unit: m.unit,
      high: 900,
      reviewedBy: "test reviewer",
      reviewedAt: "2026-10-14",
      source: "synthetic test fixture",
    };
    expect(labStatus({ ...record, value: 901 }, m, [policy])).toBe("critical");
    expect(
      labStatus({ ...record, value: 901 }, m, [{ ...policy, reviewedBy: "" }]),
    ).toBe("unknown");
    expect(
      labStatus({ ...record, value: 901 }, { ...m, unit: "other" }, [policy]),
    ).toBe("unknown");
  });
});
