import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import SiteFooter from "@/components/common/SiteFooter";
import DataNotice from "@/components/common/DataNotice";
import SectionHeading from "@/components/common/SectionHeading";
import EventsExplorer from "@/components/events/EventsExplorer";
import EventCalendar from "@/components/events/EventCalendar";
import EventsJsonLd from "@/components/seo/EventsJsonLd";
import { getFestivalEventsData } from "@/domain/events/service";
import { SOCIETY } from "@/config/site";

/** Must be a literal for Next.js segment config. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "All Events",
  description: `Complete ${SOCIETY.festival} schedule for ${SOCIETY.name} — today's, upcoming and past events with venue, timing, category and coordinator details.`,
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const data = await getFestivalEventsData();

  return (
    <>
      <Header />

      <main id="main">
        <section className="pageHero">
          <div className="container">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">All Events</span>
            </nav>
            <h1>All Ganeshotsav Events</h1>
            <p>
              The complete {SOCIETY.name} celebration schedule — filter by status, category or date,
              or search for a specific program, venue or coordinator.
            </p>
          </div>
        </section>

        <DataNotice meta={data.meta} />

        <section className="section" aria-labelledby="schedule-heading">
          <div className="container">
            <SectionHeading
              id="schedule-heading"
              kicker="Complete program"
              title="Festival Schedule"
              text="Every program from Sthapana to Visarjan, in one place."
              align="center"
            />

            <EventsExplorer events={data.allEvents} categories={data.categories} />

            <div className="centerAction">
              <Link className="button gold" href="/#register">
                Register for an Event
              </Link>
            </div>
          </div>
        </section>

        <section id="calendar" className="section cream" aria-labelledby="events-calendar-heading">
          <div className="container">
            <SectionHeading
              id="events-calendar-heading"
              kicker="Day by day"
              title="Event Calendar"
              text="A compact overview of every festival day."
              align="center"
            />
            <EventCalendar days={data.calendar} />
          </div>
        </section>
      </main>

      <SiteFooter />

      <EventsJsonLd events={data.allEvents} />
    </>
  );
}
