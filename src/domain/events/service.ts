import { loadEvents } from "./source";
import type { FestivalEventsData } from "./types";
import {
  buildCalendar,
  collectCategories,
  decorateEvents,
  getTodayISODate,
  selectFeatured,
} from "./utils";

/**
 * Single entry point used by every page.
 *
 * Swapping the data source (CMS, database, API) only requires changing
 * `source.ts` — no component in the UI layer imports raw data.
 */
export async function getFestivalEventsData(
  todayISO = getTodayISODate(),
): Promise<FestivalEventsData> {
  const { events, meta } = await loadEvents();
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
