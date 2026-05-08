"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type CardioChartPoint = {
  label: string;
  distanceKm: number;
  sortKey: number;
};

export function CardioDistanceChart({ data }: { data: CardioChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm text-white/50">
        Pro tuto aktivitu zatím nemáš žádné záznamy s vzdáleností (km).
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full rounded-xl border border-white/10 bg-black/20 p-2 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
            tickLine={false}
            width={40}
            domain={["auto", "auto"]}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(12, 15, 26, 0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            formatter={(value) => [
              `${value != null ? value : "—"} km`,
              "Vzdálenost",
            ]}
          />
          <Line
            type="monotone"
            dataKey="distanceKm"
            stroke="url(#lineGradCardio)"
            strokeWidth={2}
            dot={{ fill: "#22d3ee", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <defs>
            <linearGradient id="lineGradCardio" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
