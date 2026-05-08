import Link from "next/link";

import { dailyActivityLabel } from "@/lib/daily-activity-labels";
import { formatDurationHms } from "@/lib/format-duration";

import { DeleteDailyActivityButton } from "./delete-daily-activity-button";
import { EditDailyActivityModal, type DailyActivityEditable } from "./edit-daily-activity-modal";

function formatPanelDayDate(dateStr: string) {
  const [Y, M, D] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Y, M - 1, D));
}

function formatWorkoutTime(iso: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function CalendarDayDetailPanel({
  dateStr,
  monthKey,
  activities,
  workouts,
}: {
  dateStr: string;
  monthKey: string;
  activities: DailyActivityEditable[];
  workouts: { id: string; title: string | null; performed_at: string }[];
}) {
  const closeHref = `/app?m=${encodeURIComponent(monthKey)}`;

  return (
    <div className="mt-4 rounded-xl border border-indigo-400/25 bg-indigo-500/10 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-indigo-200/80">
            Detail dne
          </div>
          <h3 className="mt-1 text-base font-semibold text-white">
            {formatPanelDayDate(dateStr)}
          </h3>
        </div>
        <Link
          href={closeHref}
          className="shrink-0 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white/80 hover:bg-black/45"
          scroll={false}
        >
          Zavřít
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-fuchsia-200/75">
            Tréninky
          </div>
          {workouts.length === 0 ? (
            <p className="mt-2 text-sm text-white/45">Žádný trénink tento den.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {workouts.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/app/workouts/${w.id}`}
                    className="block rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-2 text-sm text-white/90 transition hover:border-fuchsia-400/35 hover:bg-fuchsia-500/15"
                  >
                    <span className="font-medium">
                      {w.title?.trim() || "Trénink"}
                    </span>
                    <span className="mt-0.5 block text-xs text-white/45">
                      {formatWorkoutTime(w.performed_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-xs font-medium text-cyan-200/75">
            Denní aktivity
          </div>
          {activities.length === 0 ? (
            <p className="mt-2 text-sm text-white/45">
              Žádná aktivita mimo trénink — přidej ji přes + u nadpisu karty.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {activities.map((a) => {
                const label = dailyActivityLabel(
                  a.kind,
                  a.custom_label
                );
                const bits: string[] = [label];
                if (a.distance_km != null && Number(a.distance_km) > 0) {
                  bits.push(`${a.distance_km} km`);
                }
                const dur = formatDurationHms(a.duration_sec);
                if (dur) bits.push(dur);
                return (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white/85">
                        {bits.join(" · ")}
                      </div>
                      {a.notes ? (
                        <div className="mt-0.5 text-xs text-white/40">
                          {a.notes}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <EditDailyActivityModal activity={a} />
                      <DeleteDailyActivityButton
                        activityId={a.id}
                        label={label}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
