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

import { formatDurationHms } from "@/lib/format-duration";

export type DailyActivityChartPoint = {
  label: string;
  distanceKm: number;
  durationSec: number;
  sortKey: number;
};

export function DailyActivityChart({ data }: { data: DailyActivityChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm text-white/50">
        Pro tento typ zatím nemáš žádný den se zapsanými kilometry. Záznamy
        přidáváš na dashboardu (+ u denních aktivit).
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
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as DailyActivityChartPoint | undefined;
              if (!row) return null;
              const dur = formatDurationHms(row.durationSec);
              return (
                <div className="rounded-xl px-3 py-2 text-sm">
                  <div className="text-white/65">{label}</div>
                  <div className="mt-1 text-white/90">
                    {row.distanceKm} km
                    {dur ? (
                      <span className="block text-xs text-white/55">
                        Čas v ten den: {dur}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="distanceKm"
            stroke="url(#lineGradDailyAct)"
            strokeWidth={2}
            dot={{ fill: "#34d399", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <defs>
            <linearGradient id="lineGradDailyAct" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
