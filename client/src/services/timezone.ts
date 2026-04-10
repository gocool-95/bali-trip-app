import { type LocalActivity } from './db';

// Fixed UTC offsets in minutes (no DST for either timezone)
const TZ_OFFSETS: Record<string, number> = {
  'Asia/Kolkata': 330,    // UTC+5:30
  'Asia/Makassar': 480,   // UTC+8:00 (Bali WITA)
};

const TZ_LABELS: Record<string, string> = {
  'Asia/Kolkata': 'IST',
  'Asia/Makassar': 'WITA',
};

export const TIMEZONE_IST = 'Asia/Kolkata';
export const TIMEZONE_BALI = 'Asia/Makassar';
export const DEFAULT_TIMEZONE = TIMEZONE_BALI;

/**
 * Convert an activity's date + time + timezone to a UTC Date object.
 * This allows comparing activities across timezones using standard Date comparison.
 */
export function activityToUTC(activity: { date: string; time: string; timezone?: string }): Date {
  const tz = activity.timezone || DEFAULT_TIMEZONE;
  const offsetMin = TZ_OFFSETS[tz] ?? 480;
  const [h, m] = activity.time.split(':').map(Number);

  // Create date as if it were UTC, then subtract the timezone offset
  const utc = new Date(`${activity.date}T${pad(h)}:${pad(m)}:00.000Z`);
  utc.setMinutes(utc.getMinutes() - offsetMin);
  return utc;
}

/**
 * Convert an activity's endTime to a UTC Date, or default to startTime + 1 hour.
 */
export function activityEndToUTC(activity: LocalActivity): Date {
  if (activity.endTime) {
    return activityToUTC({ date: activity.date, time: activity.endTime, timezone: activity.timezone });
  }
  const start = activityToUTC(activity);
  return new Date(start.getTime() + 60 * 60 * 1000);
}

/**
 * Get the short timezone label (IST, WITA) for display.
 */
export function getTimezoneLabel(tz?: string): string {
  return TZ_LABELS[tz || DEFAULT_TIMEZONE] || 'WITA';
}

/**
 * Check if an activity uses a non-default (non-Bali) timezone.
 */
export function isNonDefaultTimezone(tz?: string): boolean {
  return !!tz && tz !== DEFAULT_TIMEZONE;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
