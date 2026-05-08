"use client";

import Link from "next/link";
import { useMemo } from "react";

export function ActivityMonthCalendar({
  year,
  monthIndex,
  datesWithActivity,
  datesWithWorkout,
  viewMonthKey,
  selectedDay,
}: {
  year: number;
  monthIndex: number;
  datesWithActivity: string[];
  datesWithWorkout: string[];
  viewMonthKey: string;
  selectedDay: string | null;
}) {
  const act = useMemo(() => new Set(datesWithActivity), [datesWithActivity]);
  const wo = useMemo(() => new Set(datesWithWorkout), [datesWithWorkout]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === monthIndex &&
    today.getDate() === day;

  const key = (day: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const first = new Date(year, monthIndex, 1);
  const pad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weekDays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

  const dayHref = (day: number) =>
    `/app?m=${encodeURIComponent(viewMonthKey)}&d=${encodeURIComponent(key(day))}`;

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-white/45">
        {weekDays.map((w) => (
          <div key={w} className="py-1 font-medium">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) =>
          day == null ? (
            <div key={`e-${i}`} className="aspect-square min-h-9" />
          ) : (
            <Link
              key={day}
              href={dayHref(day)}
              scroll={false}
              aria-label={`Detail dne ${day}. ${monthIndex + 1}. ${year}`}
              className={`flex min-h-9 flex-col items-center justify-center rounded-lg border text-sm tabular-nums transition hover:brightness-110 ${
                selectedDay === key(day)
                  ? "ring-2 ring-indigo-400/70 ring-offset-1 ring-offset-black/50"
                  : ""
              } ${
                wo.has(key(day))
                  ? isToday(day)
                    ? "border-fuchsia-400/70 bg-fuchsia-500/20 text-white shadow-[0_0_0_1px_rgba(217,70,239,0.25)]"
                    : "border-fuchsia-500/45 bg-fuchsia-500/12 text-white/90 shadow-[inset_0_0_0_1px_rgba(217,70,239,0.2)]"
                  : isToday(day)
                    ? "border-indigo-400/50 bg-indigo-500/15 text-white"
                    : "border-white/5 bg-white/5 text-white/85"
              }`}
            >
              <span>{day}</span>
              <span
                className="mt-0.5 flex min-h-1.5 items-center justify-center gap-0.5"
                aria-hidden
              >
                {wo.has(key(day)) ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                ) : null}
                {act.has(key(day)) ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/90" />
                ) : null}
                {!wo.has(key(day)) && !act.has(key(day)) ? (
                  <span className="h-1.5 w-1.5 shrink-0" />
                ) : null}
              </span>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
