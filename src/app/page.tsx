import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import SiteFooter from "@/components/common/SiteFooter";
import DataNotice from "@/components/common/DataNotice";
import SectionHeading from "@/components/common/SectionHeading";
import EventSection from "@/components/events/EventSection";
import EventCalendar from "@/components/events/EventCalendar";
import HeroSection from "@/components/home/HeroSection";
import AartiSection from "@/components/home/AartiSection";
import ContributeSection from "@/components/home/ContributeSection";
import RegisterSection from "@/components/home/RegisterSection";
import EventsJsonLd from "@/components/seo/EventsJsonLd";
import { getFestivalEventsData } from "@/domain/events/service";

/**
 * Statically generated, refreshed in the background from the Google Sheet.
 * Next.js requires a literal here; the fetch-level window is configurable via
 * `EVENTS_REVALIDATE_SECONDS`.
 */
export const revalidate = 300;

const UPCOMING_PREVIEW_COUNT = 3;

export default async function HomePage() {
  const data = await getFestivalEventsData();
  const upcomingPreview = data.upcomingEvents.slice(0, UPCOMING_PREVIEW_COUNT);

  return (
    <>
      <Header />

      <main id="main">
        <HeroSection data={data} />

        <DataNotice meta={data.meta} />

        <EventSection
          id="today"
          kicker="Happening now"
          title="Today’s Event"
          text="The programs scheduled for today at Austin Arena."
          events={data.todayEvents}
          emptyTitle="No event scheduled for today"
          emptyText="Explore the upcoming programs below and register in advance."
          emptyAction={
            <Link className="button ghostBtn" href="#upcoming">
              See upcoming events
            </Link>
          }
          showFormShortcut
          highlightCards
          className="spotlight"
        />

        <EventSection
          id="featured"
          kicker="Committee picks"
          title="Featured Events"
          text="The celebrations our residents look forward to the most."
          events={data.featuredEvents}
          emptyTitle="Highlights coming soon"
          emptyText="The committee will feature signature programs here shortly."
          showFormShortcut
          className="featured"
        />

        <EventSection
          id="upcoming"
          kicker="Coming up next"
          title="Upcoming Events"
          text="Plan ahead and register for the activities your family enjoys most."
          events={upcomingPreview}
          emptyTitle="No upcoming events right now"
          emptyText="The committee will publish the next schedule update soon."
          showFormShortcut
          className="cream"
          footer={
            data.allEvents.length > 0 ? (
              <div className="centerAction">
                <Link className="button" href="/events">
                  See all {data.allEvents.length} events <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            ) : null
          }
        />

        <section id="calendar" className="section" aria-labelledby="calendar-heading">
          <div className="container">
            <SectionHeading
              id="calendar-heading"
              kicker="Day by day"
              title="Event Calendar"
              text="The full festival at a glance, from Sthapana to Visarjan."
              align="center"
            />
            <EventCalendar days={data.calendar} />
          </div>
        </section>

        <AartiSection />

        <ContributeSection />

        <RegisterSection events={data.registrationEvents} />
      </main>

      <SiteFooter />

      <EventsJsonLd events={data.allEvents} />
    </>
  );
}
