"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function createWorkout(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const performedAt = String(formData.get("performed_at") ?? "").trim(); // yyyy-mm-dd
  const notes = String(formData.get("notes") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/workouts");

  const performed_at = performedAt ? new Date(`${performedAt}T12:00:00.000Z`) : new Date();

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      title: title || null,
      notes: notes || null,
      performed_at: performed_at.toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/app/workouts?error=${encodeURIComponent(error?.message ?? "Chyba vytvoření tréninku")}`);
  }

  revalidatePath("/app/workouts");
  redirect(`/app/workouts/${data.id}`);
}

export async function addSet(workoutId: string, formData: FormData) {
  const exerciseId = String(formData.get("exercise_id") ?? "").trim();
  const setCountRaw = String(formData.get("set_count") ?? "1").trim();
  const repsRaw = String(formData.get("reps") ?? "").trim();
  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const rpeRaw = String(formData.get("rpe") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!exerciseId) return;

  let setCount = Math.floor(Number(setCountRaw) || 1);
  if (setCount < 1) setCount = 1;
  if (setCount > 50) setCount = 50;

  const reps = repsRaw ? Number(repsRaw) : null;
  const weight_kg = weightRaw ? Number(weightRaw) : null;
  const rpe = rpeRaw ? Number(rpeRaw) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/workouts/${workoutId}`);

  const { data: last } = await supabase
    .from("workout_sets")
    .select("set_index")
    .eq("workout_id", workoutId)
    .eq("exercise_id", exerciseId)
    .order("set_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextIndex = (last?.set_index ?? 0) + 1;
  const rows = Array.from({ length: setCount }, (_, i) => ({
    user_id: user.id,
    workout_id: workoutId,
    exercise_id: exerciseId,
    set_index: nextIndex + i,
    reps,
    weight_kg,
    rpe,
    notes: notes || null,
  }));

  await supabase.from("workout_sets").insert(rows);

  revalidatePath(`/app/workouts/${workoutId}`);
}

export async function deleteSet(workoutId: string, setId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/workouts/${workoutId}`);

  await supabase.from("workout_sets").delete().eq("id", setId);
  revalidatePath(`/app/workouts/${workoutId}`);
}

export async function deleteExerciseSets(workoutId: string, exerciseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/workouts/${workoutId}`);

  await supabase
    .from("workout_sets")
    .delete()
    .eq("workout_id", workoutId)
    .eq("exercise_id", exerciseId);
  revalidatePath(`/app/workouts/${workoutId}`);
}

export async function deleteWorkoutSetGroup(
  workoutId: string,
  formData: FormData
) {
  const ids = formData.getAll("set_id").map(String).filter(Boolean);
  if (ids.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/workouts/${workoutId}`);

  await supabase.from("workout_sets").delete().in("id", ids);
  revalidatePath(`/app/workouts/${workoutId}`);
}

export async function updateWorkoutSetGroup(
  workoutId: string,
  formData: FormData
) {
  const ids = formData.getAll("set_id").map(String).filter(Boolean);
  if (ids.length === 0) return;

  const setCountRaw = String(formData.get("set_count") ?? "").trim();
  let setCount = Math.floor(Number(setCountRaw) || ids.length);
  if (setCount < 1) setCount = 1;
  if (setCount > 50) setCount = 50;

  const repsRaw = String(formData.get("reps") ?? "").trim();
  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const rpeRaw = String(formData.get("rpe") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const reps = repsRaw ? Number(repsRaw) : null;
  const weight_kg = weightRaw ? Number(weightRaw) : null;
  const rpe = rpeRaw ? Number(rpeRaw) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/workouts/${workoutId}`);

  const { data: rows, error: fetchError } = await supabase
    .from("workout_sets")
    .select("id,set_index,exercise_id")
    .eq("workout_id", workoutId)
    .in("id", ids);

  if (fetchError || !rows?.length) return;

  const exercise_id = rows[0].exercise_id;
  const sorted = [...rows].sort((a, b) => a.set_index - b.set_index);
  const sortedIds = sorted.map((r) => r.id);
  const maxIndexInBlock = Math.max(...sorted.map((r) => r.set_index));

  const payload = {
    reps,
    weight_kg,
    rpe,
    notes: notes || null,
  };

  if (setCount <= sortedIds.length) {
    const keep = sortedIds.slice(0, setCount);
    const remove = sortedIds.slice(setCount);
    if (remove.length) {
      await supabase.from("workout_sets").delete().in("id", remove);
    }
    await supabase.from("workout_sets").update(payload).in("id", keep);
  } else {
    await supabase.from("workout_sets").update(payload).in("id", sortedIds);
    const toAdd = setCount - sortedIds.length;
    const newRows = Array.from({ length: toAdd }, (_, i) => ({
      user_id: user.id,
      workout_id: workoutId,
      exercise_id,
      set_index: maxIndexInBlock + i + 1,
      reps,
      weight_kg,
      rpe,
      notes: notes || null,
    }));
    await supabase.from("workout_sets").insert(newRows);
  }

  revalidatePath(`/app/workouts/${workoutId}`);
}

export async function deleteWorkout(workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/workouts");

  await supabase.from("workouts").delete().eq("id", workoutId);
  revalidatePath("/app/workouts");
}

