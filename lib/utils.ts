import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a duration in seconds into a human-readable string.
 * Examples:
 *   5430  → "1h 30m 30s"
 *   2700  → "45m"
 *   30    → "30s"
 */
export function formatDurationSeconds(totalSeconds: number | null | undefined): string {
  if (!totalSeconds || totalSeconds <= 0) return "";
  const totalSecs = Math.round(totalSeconds);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);
  return parts.join(" ") || "0s";
}

/**
 * Formats a decimal `duration_minutes` value into a human-readable string.
 */
export function formatDuration(totalMinutes: number | null | undefined): string {
  if (!totalMinutes || totalMinutes <= 0) return "";
  return formatDurationSeconds(totalMinutes * 60);
}
