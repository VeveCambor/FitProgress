"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DAILY_ACTIVITY_KINDS } from "@/lib/daily-activity-labels";

function parseDecimal(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function isValidKind(k: string): k is (typeof DAILY_ACTIVITY_KINDS)[number] {
  return (DAILY_ACTIVITY_KINDS as readonly string[]).includes(k);
}

export async function addDailyActivity(formData: FormData) {
  const dateStr = String(formData.get("activity_date") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "").trim();
  const customLabel = String(formData.get("custom_label") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const distance_km = parseDecimal(String(formData.get("distance_km") ?? ""));
  const durMin = Math.max(
    0,
    Math.floor(Number(String(formData.get("duration_min") ?? "0")) || 0)
  );
  const durSecPart = Math.max(
    0,
    Math.min(59, Math.floor(Number(String(formData.get("duration_sec") ?? "0")) || 0))
  );
  const duration_sec = durMin * 60 + durSecPart;

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  if (!isValidKind(kindRaw)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  const { error } = await supabase.from("daily_activities").insert({
    user_id: user.id,
    activity_date: dateStr,
    kind: kindRaw,
    custom_label:
      kindRaw === "other" && customLabel ? customLabel : null,
    distance_km:
      distance_km != null && distance_km > 0 ? distance_km : null,
    duration_sec: duration_sec > 0 ? duration_sec : null,
    notes: notes || null,
  });

  if (error) {
    redirect(`/app?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app");
}

export async function updateDailyActivity(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const dateStr = String(formData.get("activity_date") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "").trim();
  const customLabel = String(formData.get("custom_label") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const distance_km = parseDecimal(String(formData.get("distance_km") ?? ""));
  const durMin = Math.max(
    0,
    Math.floor(Number(String(formData.get("duration_min") ?? "0")) || 0)
  );
  const durSecPart = Math.max(
    0,
    Math.min(59, Math.floor(Number(String(formData.get("duration_sec") ?? "0")) || 0))
  );
  const duration_sec = durMin * 60 + durSecPart;

  if (!id || !dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  if (!isValidKind(kindRaw)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  const { error } = await supabase
    .from("daily_activities")
    .update({
      activity_date: dateStr,
      kind: kindRaw,
      custom_label:
        kindRaw === "other" && customLabel ? customLabel : null,
      distance_km:
        distance_km != null && distance_km > 0 ? distance_km : null,
      duration_sec: duration_sec > 0 ? duration_sec : null,
      notes: notes || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/app?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app");
}

export async function deleteDailyActivity(activityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  await supabase
    .from("daily_activities")
    .delete()
    .eq("id", activityId)
    .eq("user_id", user.id);

  revalidatePath("/app");
}
