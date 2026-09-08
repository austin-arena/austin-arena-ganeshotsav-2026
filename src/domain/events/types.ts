/** Timing bucket derived from the event date relative to "today". */
export type EventTiming = "today" | "upcoming" | "past";

/** Kept for backwards compatibility with earlier imports. */
export type EventStatus = EventTiming;

/** Committee-controlled lifecycle, optionally overridden from the sheet. */
export type EventLifecycle = "scheduled" | "cancelled" | "postponed";

/** A raw spreadsheet row, before normalisation. */
export type EventSheetRow = Record<string, string>;

/** A normalised event, independent of where the data came from. */
export interface EventRecord {
  id: string;
  name: string;
  /** `YYYY-MM-DD` in the festival timezone. */
  dateISO: string;
  /** Weekday label, derived when the sheet omits it. */
  day: string;
  time: string;
  venue: string;
  category: string;
  description: string;
  coordinator: string;
  contact?: string;
  participants?: string;
  ageGroup?: string;
  rules?: string;
  registrationLink?: string;
  /** Optional "more info" link from the sheet's `Link` column. */
  link?: string;
  /** Optional button label for {@link link}, from the sheet's `Link Label` column. */
  linkLabel?: string;
  featured: boolean;
  lifecycle: EventLifecycle;
}

/** An event decorated with values that depend on the current date. */
export interface FestivalEvent extends EventRecord {
  timing: EventTiming;
  /** Alias of {@link timing}, kept for template readability. */
  status: EventTiming;
  /** e.g. `Mon, 14 Sep 2026`. */
  dateLabel: string;
  /** e.g. `14 Sep`. */
  shortDateLabel: string;
}

/** One day of the festival calendar. */
export interface CalendarDay {
  dateISO: string;
  dateLabel: string;
  shortDateLabel: string;
  day: string;
  timing: EventTiming;
  events: FestivalEvent[];
}

/** Where the rendered event data came from — surfaced in the UI when degraded. */
export type EventSourceKind = "google-sheet" | "local-fallback";

export interface EventSourceMeta {
  source: EventSourceKind;
  /** ISO timestamp of the moment the data was resolved. */
  fetchedAt: string;
  /** Present when the sheet could not be read and the fallback was used. */
  warning?: string;
}

export interface FestivalEventsData {
  allEvents: FestivalEvent[];
  todayEvents: FestivalEvent[];
  upcomingEvents: FestivalEvent[];
  pastEvents: FestivalEvent[];
  featuredEvents: FestivalEvent[];
  registrationEvents: FestivalEvent[];
  calendar: CalendarDay[];
  categories: string[];
  /** Festival window, used by the countdown and metadata. */
  startDateISO?: string;
  endDateISO?: string;
  meta: EventSourceMeta;
}
