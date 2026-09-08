import type {
  CalendarDay,
  EventRecord,
  EventTiming,
  FestivalEvent,
} from "./types";

/** All festival scheduling is expressed in the society's local timezone. */
export const FESTIVAL_TIME_ZONE = "Asia/Kolkata";

const isoFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: FESTIVAL_TIME_ZONE });

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "long",
});

const shortWeekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
});

/**
 * Month abbreviations are defined explicitly rather than taken from CLDR,
 * which renders September as "Sept" for en-GB/en-IN.
 */
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Anchors an ISO date at midday UTC so formatting never shifts across a day boundary. */
function toSafeDate(dateISO: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    return null;
  }

  const date = new Date(`${dateISO}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Today's date in the festival timezone, as `YYYY-MM-DD`. */
export function getTodayISODate(): string {
  return isoFormatter.format(new Date());
}

/** `Mon, 7 Sep 2026` */
export function formatLongDate(dateISO: string): string {
  const date = toSafeDate(dateISO);

  if (!date) {
    return dateISO;
  }

  const weekday = shortWeekdayFormatter.format(date);
  return `${weekday}, ${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** `7 Sep` */
export function formatShortDate(dateISO: string): string {
  const date = toSafeDate(dateISO);

  if (!date) {
    return dateISO;
  }

  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]}`;
}

/** `Monday` */
export function formatWeekday(dateISO: string): string {
  const date = toSafeDate(dateISO);
  return date ? weekdayFormatter.format(date) : "";
}

export function getEventTiming(dateISO: string, todayISO: string): EventTiming {
  if (dateISO === todayISO) {
    return "today";
  }

  return dateISO > todayISO ? "upcoming" : "past";
}

/** Decorates records with date-dependent presentation values. */
export function decorateEvents(
  events: EventRecord[],
  todayISO = getTodayISODate(),
): FestivalEvent[] {
  return events.map((event) => {
    const timing = getEventTiming(event.dateISO, todayISO);

    return {
      ...event,
      timing,
      status: timing,
      dateLabel: formatLongDate(event.dateISO),
      shortDateLabel: formatShortDate(event.dateISO),
    };
  });
}

/** Converts `6:30 PM` / `18:30` into minutes past midnight for sorting. */
export function toMinutes(time: string): number {
  const match = time.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  }
  if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/** Chronological ordering by date then start time. */
export function sortByDateTime(a: EventRecord, b: EventRecord): number {
  if (a.dateISO !== b.dateISO) {
    return a.dateISO.localeCompare(b.dateISO);
  }

  return toMinutes(a.time) - toMinutes(b.time) || a.name.localeCompare(b.name);
}

/** Groups events into calendar days, preserving chronological order. */
export function buildCalendar(events: FestivalEvent[]): CalendarDay[] {
  const byDate = new Map<string, FestivalEvent[]>();

  for (const event of events) {
    const bucket = byDate.get(event.dateISO);
    if (bucket) {
      bucket.push(event);
    } else {
      byDate.set(event.dateISO, [event]);
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateISO, dayEvents]) => ({
      dateISO,
      dateLabel: dayEvents[0].dateLabel,
      shortDateLabel: dayEvents[0].shortDateLabel,
      day: dayEvents[0].day,
      timing: dayEvents[0].timing,
      events: dayEvents,
    }));
}

/** Unique, alphabetically sorted category list for filter controls. */
export function collectCategories(events: EventRecord[]): string[] {
  return [...new Set(events.map((event) => event.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Featured events for the homepage highlight rail.
 *
 * Explicitly flagged events win. If the committee has not flagged anything we
 * fall back to the nearest events still ahead, so the rail is never empty.
 */
export function selectFeatured(events: FestivalEvent[], limit = 3): FestivalEvent[] {
  const flagged = events.filter((event) => event.featured && event.timing !== "past");

  if (flagged.length > 0) {
    return flagged.slice(0, limit);
  }

  const ahead = events.filter((event) => event.timing !== "past");
  const pool = ahead.length > 0 ? ahead : [...events].reverse();

  return pool
    .slice()
    .sort((a, b) => Number(Boolean(b.registrationLink)) - Number(Boolean(a.registrationLink)))
    .slice(0, limit);
}
