export const DAILY_ACTIVITY_KINDS = [
  "walk",
  "hike",
  "run",
  "bike",
  "swim",
  "ski",
  "other",
] as const;

export type DailyActivityKind = (typeof DAILY_ACTIVITY_KINDS)[number];

export function dailyActivityLabel(
  kind: string,
  customLabel: string | null
): string {
  if (kind === "other" && customLabel?.trim()) return customLabel.trim();
  switch (kind) {
    case "walk":
      return "Procházka";
    case "hike":
      return "Tůra";
    case "run":
      return "Běh";
    case "bike":
      return "Kolo";
    case "swim":
      return "Plavání";
    case "ski":
      return "Lyžování / běžky";
    case "other":
      return "Jiné";
    default:
      return kind;
  }
}
