"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { IconPencil } from "@/components/workout-icons";

import { updateDailyActivity } from "./actions";

export type DailyActivityEditable = {
  id: string;
  activity_date: string;
  kind: string;
  custom_label: string | null;
  distance_km: number | null;
  duration_sec: number | null;
  notes: string | null;
};

function splitDuration(totalSec: number | null) {
  if (totalSec == null || totalSec <= 0) return { min: 0, sec: 0 };
  const s = Math.floor(totalSec);
  return { min: Math.floor(s / 60), sec: s % 60 };
}

export function EditDailyActivityModal({
  activity,
}: {
  activity: DailyActivityEditable;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(activity.kind);
  const [isPending, startTransition] = useTransition();

  const { min: initialMin, sec: initialSec } = useMemo(
    () => splitDuration(activity.duration_sec),
    [activity.duration_sec]
  );

  const distanceDefault =
    activity.distance_km != null && Number(activity.distance_km) > 0
      ? String(activity.distance_km)
      : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/30 text-white/75 hover:bg-white/10 hover:text-white"
        aria-label="Upravit aktivitu"
        title="Upravit"
      >
        <IconPencil className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0f1a] p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-act-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3
              id="edit-act-title"
              className="text-base font-semibold text-white"
            >
              Upravit aktivitu
            </h3>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(() => {
                  void updateDailyActivity(fd).then(() => {
                    setOpen(false);
                    router.refresh();
                  });
                });
              }}
            >
              <input type="hidden" name="id" value={activity.id} />

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor={`ea-date-${activity.id}`}
                >
                  Den
                </label>
                <input
                  id={`ea-date-${activity.id}`}
                  name="activity_date"
                  type="date"
                  required
                  defaultValue={activity.activity_date}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor={`ea-kind-${activity.id}`}
                >
                  Aktivita
                </label>
                <select
                  id={`ea-kind-${activity.id}`}
                  name="kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="walk">Procházka</option>
                  <option value="hike">Tůra</option>
                  <option value="run">Běh</option>
                  <option value="bike">Kolo</option>
                  <option value="swim">Plavání</option>
                  <option value="ski">Lyžování / běžky</option>
                  <option value="other">Jiné</option>
                </select>
              </div>

              {kind === "other" ? (
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-white/80"
                    htmlFor={`ea-custom-${activity.id}`}
                  >
                    Název (jinde)
                  </label>
                  <input
                    id={`ea-custom-${activity.id}`}
                    name="custom_label"
                    defaultValue={activity.custom_label ?? ""}
                    placeholder="např. jóga, brusle…"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor={`ea-km-${activity.id}`}
                >
                  Vzdálenost (km, volitelné)
                </label>
                <input
                  id={`ea-km-${activity.id}`}
                  name="distance_km"
                  inputMode="decimal"
                  defaultValue={distanceDefault}
                  placeholder="např. 8,5"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-white/80"
                    htmlFor={`ea-dm-${activity.id}`}
                  >
                    Minuty
                  </label>
                  <input
                    id={`ea-dm-${activity.id}`}
                    name="duration_min"
                    inputMode="numeric"
                    defaultValue={initialMin || ""}
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-white/80"
                    htmlFor={`ea-ds-${activity.id}`}
                  >
                    Sekundy
                  </label>
                  <input
                    id={`ea-ds-${activity.id}`}
                    name="duration_sec"
                    inputMode="numeric"
                    placeholder="0–59"
                    min={0}
                    max={59}
                    defaultValue={initialSec || ""}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor={`ea-notes-${activity.id}`}
                >
                  Poznámka
                </label>
                <input
                  id={`ea-notes-${activity.id}`}
                  name="notes"
                  defaultValue={activity.notes ?? ""}
                  placeholder="volitelné"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="cursor-pointer rounded-xl bg-linear-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Ukládám…" : "Uložit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
