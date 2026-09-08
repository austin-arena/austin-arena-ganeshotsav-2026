import type { Metadata } from "next";
import EventsView from "@/components/events/EventsView";
import { getFestivalEventsData } from "@/domain/events/service";
import { SOCIETY } from "@/config/site";

export const metadata: Metadata = {
  title: "All Events",
  description: `Complete ${SOCIETY.festival} schedule for ${SOCIETY.name} — today's, upcoming and past events with venue, timing, category and coordinator details.`,
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  // Build-time seed for instant paint and SEO; the browser refreshes it live.
  const seed = await getFestivalEventsData();
  return <EventsView seed={seed} />;
}
