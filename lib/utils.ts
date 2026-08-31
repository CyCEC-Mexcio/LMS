import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a decimal `duration_minutes` value into a human-readable string.
 * Examples:
 *   90.5   → "1h 30m 30s"
 *   45     → "45m"
 *   0.5    → "30s"
 *   1.0083 → "1m 0s"  (rounds to nearest second)
 */
export function formatDuration(totalMinutes: number | null | undefined): string {
  if (!totalMinutes || totalMinutes <= 0) return "";
  const totalSecs = Math.round(totalMinutes * 60);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);
  return parts.join(" ") || "0s";
}
