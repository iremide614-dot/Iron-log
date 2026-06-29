// ===== date & number formatting (ported from original) =====

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** YYYY-MM-DD for a Date in local time */
export function fmtDate(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function today(): string {
  return fmtDate(new Date());
}

/** "Mon, Jan 5" */
export function dateStr(ds: string): string {
  const d = new Date(ds + "T12:00:00");
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Jan 5" */
export function shortDate(ds: string): string {
  const d = new Date(ds + "T12:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** seconds -> "1h 04m" / "23m" / "45s" */
export function fmtDuration(secs: number): string {
  if (!secs) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m`;
  return `${s}s`;
}

/** seconds -> "12:05" clock for timers */
export function clock(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtVol(v: number): string {
  if (v >= 1000) return (v / 1000).toFixed(1) + "k";
  return String(Math.round(v));
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
