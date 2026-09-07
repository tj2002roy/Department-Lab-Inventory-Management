import { format } from "date-fns";

/**
 * Formats a Date or timestamp string to the required standard:
 * "[DD/MM/YYYY] at [HH:mm]" (e.g., "07/09/2026 at 10:15")
 */
export function formatAuditDateTime(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";
  return format(d, "dd/MM/yyyy 'at' HH:mm");
}

export function formatShortDate(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";
  return format(d, "dd/MM/yyyy");
}
