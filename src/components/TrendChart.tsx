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
        title="這段期間尚無紀錄"
        description="調整日期範圍，或新增一筆健康數據。"
      />
    );

  const crossYear = new Set(rows.map((r) => format(r.at, "yyyy"))).size > 1;
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label={`${definitions.map((m) => m.name).join("、")}趨勢，${rows.length} 筆紀錄，單位 ${definitions[0]?.unit}`}
    >
      <ResponsiveContainer
        width="100%"
        height={mobile ? Math.min(height, 260) : height}
      >
        <LineChart
          data={dailyPoints(rows)}
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
              dot={{
                r: 3.5,
                strokeWidth: 2,
                stroke: "var(--card)",
                fill: m.color,
              }}
              connectNulls={false}
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
    </div>
  );
}
