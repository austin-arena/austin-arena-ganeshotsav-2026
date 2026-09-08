import { loadEvents } from "./source";
import type { EventRecord, EventSourceMeta, FestivalEventsData } from "./types";
import {
  buildCalendar,
  collectCategories,
  decorateEvents,
  getTodayISODate,
  selectFeatured,
} from "./utils";

/**
 * Pure transform: normalised records + source meta → grouped view model.
 *
 * Shared by the server (`getFestivalEventsData`) and the client-side hook so
 * both produce identical groupings. Contains no I/O, so it is safe in the browser.
 */
export function buildFestivalEventsData(
  events: EventRecord[],
  meta: EventSourceMeta,
  todayISO = getTodayISODate(),
): FestivalEventsData {
  const allEvents = decorateEvents(events, todayISO);

  return {
    allEvents,
    todayEvents: allEvents.filter((event) => event.timing === "today"),
    upcomingEvents: allEvents.filter((event) => event.timing === "upcoming"),
    pastEvents: allEvents.filter((event) => event.timing === "past").reverse(),
    featuredEvents: selectFeatured(allEvents),
    registrationEvents: allEvents.filter(
      (event) => event.timing !== "past" && event.lifecycle === "scheduled",
    ),
    calendar: buildCalendar(allEvents),
    categories: collectCategories(allEvents),
    startDateISO: allEvents[0]?.dateISO,
    endDateISO: allEvents[allEvents.length - 1]?.dateISO,
    meta,
  };
}

/**
 * Single entry point used by every page at build time.
 *
 * Swapping the data source (CMS, database, API) only requires changing
 * `source.ts` — no component in the UI layer imports raw data.
 */
export async function getFestivalEventsData(
  todayISO = getTodayISODate(),
): Promise<FestivalEventsData> {
  const { events, meta } = await loadEvents();
  return buildFestivalEventsData(events, meta, todayISO);
}
