import { LabStatusBadge } from "./LabStatusBadge";
import { labStatus, labStatuses } from "../lib/labStatus";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTaipei as format } from "../lib/model";
import { dailyPoints, type HealthRecord, type Metric } from "../lib/model";
import { Empty } from "./ui";
import { useMobile } from "../hooks/useMobile";
export function TrendChart({
  rows,
  definitions,
  height = 270,
}: {
  rows: HealthRecord[];
  definitions: Metric[];
  height?: number;
}) {
  const mobile = useMobile();
  if (!rows.length)
    return (
      <Empty
        title="尚無健康紀錄"
        description="調整日期範圍，或新增一筆健康數據。"
      />
    );

  const hasLabs = definitions.some((m) => m.group !== "日常健康");
  const recordsById = new Map(rows.map((r) => [r.id, r]));
  const points: Record<string, string | number>[] = hasLabs
    ? [...rows]
        .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
        .map((r) => ({
          at: r.at,
          [r.metricId]: r.value,
          ...(r.secondary !== undefined
            ? { [r.metricId + "-secondary"]: r.secondary }
            : {}),
          recordId: r.id,
        }))
    : dailyPoints(rows);
  const crossYear = new Set(rows.map((r) => format(r.at, "yyyy"))).size > 1;
  return (
    <div
      className="chart-wrap"
      role="group"
      aria-label={`${definitions.map((m) => m.name).join("、")}趨勢，${rows.length} 筆紀錄，單位 ${definitions[0]?.unit}`}
    >
      <div
        role="img"
        aria-label={`${definitions.map((m) => m.name).join("、")}趨勢，${rows.length} 筆紀錄，單位 ${definitions[0]?.unit}`}
      >
        <ResponsiveContainer
          width="100%"
          height={mobile ? Math.min(height, 260) : height}
        >
          <LineChart
            data={points}
            margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 5"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="at"
              tickFormatter={(v) =>
                format(new Date(v), crossYear ? "yy/M/d" : "M/d")
              }
              minTickGap={35}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 14 }}
            />
            <YAxis
              domain={["auto", "auto"]}
              width={48}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 14 }}
            />
            <Tooltip
              content={
                hasLabs
                  ? ({ active, payload }) => {
                      const r = recordsById.get(
                        String(payload?.[0]?.payload?.recordId),
                      );
                      const m = definitions.find((m) => m.id === r?.metricId);
                      return active && r && m ? (
                        <div className="lab-chart-tooltip">
                          <strong>{m.name}</strong>
                          <small>{format(r.at, "yyyy/MM/dd HH:mm")}</small>
                          <span>
                            {r.value} {m.unit}
                          </span>
                          <LabStatusBadge record={r} metric={m} />
                        </div>
                      ) : null;
                    }
                  : undefined
              }
              labelFormatter={(v) => format(new Date(String(v)), "yyyy/MM/dd")}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            />
            {definitions.map((m) => (
              <Line
                key={m.id}
                type="linear"
                dataKey={m.id}
                name={m.secondary ? "收縮壓" : m.name}
                unit={` ${m.unit}`}
                stroke={m.color}
                strokeWidth={2.6}
                dot={
                  hasLabs
                    ? ({
                        cx,
                        cy,
                        payload,
                      }: {
                        cx?: number;
                        cy?: number;
                        payload?: { recordId?: string };
                      }) => {
                        const r = recordsById.get(payload?.recordId ?? "");
                        if (
                          cx === undefined ||
                          cy === undefined ||
                          !r ||
                          r.metricId !== m.id
                        )
                          return <g />;
                        const status = labStatuses[labStatus(r, m)];
                        return (
                          <g>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill={status.color}
                              stroke="var(--card)"
                              strokeWidth={2}
                            />
                            <text
                              x={cx}
                              y={cy - 10}
                              textAnchor="middle"
                              fill={status.color}
                              fontSize={13}
                            >
                              {status.icon}
                            </text>
                          </g>
                        );
                      }
                    : {
                        r: 3.5,
                        strokeWidth: 2,
                        stroke: "var(--card)",
                        fill: m.color,
                      }
                }
                connectNulls={hasLabs}
                isAnimationActive={false}
              />
            ))}
            {definitions
              .filter((m) => m.secondary)
              .map((m) => (
                <Line
                  key={m.id + "-secondary"}
                  type="linear"
                  dataKey={m.id + "-secondary"}
                  name={m.secondary}
                  stroke="#469fa2"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#469fa2" }}
                  isAnimationActive={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {definitions.map((m) => (
          <span key={m.id}>
            <i style={{ background: m.color }} />
            {m.secondary ? "收縮壓" : m.name} <small>({m.unit})</small>
          </span>
        ))}
        {definitions
          .filter((m) => m.secondary)
          .map((m) => (
            <span key={m.id + "s"}>
              <i style={{ background: "#469fa2" }} />
              {m.secondary} <small>({m.unit})</small>
            </span>
          ))}
      </div>
      {hasLabs && (
        <>
          <div className="lab-status-legend" aria-label="檢驗狀態顏色說明">
            {Object.entries(labStatuses).map(([key, status]) => (
              <span className={`lab-status lab-status-${key}`} key={key}>
                {status.icon} {status.label}
              </span>
            ))}
          </div>
          <details className="lab-chart-results">
            <summary>查看每筆檢驗數值與判讀（{rows.length} 筆）</summary>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>指標</th>
                    <th>數值</th>
                    <th>參考區間</th>
                    <th>狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows]
                    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
                    .map((r) => {
                      const m = definitions.find((m) => m.id === r.metricId);
                      if (!m) return null;
                      return (
                        <tr key={r.id}>
                          <td>{format(r.at, "yyyy/MM/dd HH:mm")}</td>
                          <td>{m.name}</td>
                          <td>
                            {r.value} {m.unit}
                          </td>
                          <td>
                            {r.low !== undefined
                              ? `${r.lowExclusive ? ">" : "≥"} ${r.low}`
                              : "—"}{" "}
                            /{" "}
                            {r.high !== undefined
                              ? `${r.highExclusive ? "<" : "≤"} ${r.high}`
                              : "—"}
                          </td>
                          <td>
                            <LabStatusBadge record={r} metric={m} />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
