import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import Countdown from "@/components/Countdown";
import type { FestivalEventsData } from "@/domain/events/types";
import { formatLongDate } from "@/domain/events/utils";
import { SOCIETY, asset } from "@/config/site";

interface HeroSectionProps {
  data: FestivalEventsData;
}

export default function HeroSection({ data }: HeroSectionProps) {
  const { startDateISO, endDateISO } = data;

  const dateRange =
    startDateISO && endDateISO
      ? `${formatLongDate(startDateISO)} – ${formatLongDate(endDateISO)}`
      : "Dates will be announced soon";

  const stats = [
    { value: data.allEvents.length, label: "Programs" },
    { value: data.todayEvents.length, label: "Today" },
    { value: data.upcomingEvents.length, label: "Upcoming" },
  ];

  return (
    <>
      <Countdown startDateISO={startDateISO} endDateISO={endDateISO} />

      <section id="home" className="hero" aria-labelledby="hero-heading">
        <div className="container heroGrid">
          <div className="heroCopy">
            <span className="eyebrow">
              <CalendarDays aria-hidden="true" />
              {dateRange}
            </span>

            <p className="marathi" lang="mr">
              ॥ गणपती बाप्पा मोरया ॥
            </p>

            <h1 id="hero-heading">
              {SOCIETY.name} <em>Ganeshotsav 2026</em>
            </h1>

            <p className="lead">
              Days of devotion, culture and togetherness — daily aarti, competitions, cultural
              evenings and community seva for every {SOCIETY.name} family.
            </p>

            <div className="actions">
              <Link className="button gold" href="#today">
                Today’s Event
              </Link>
              <Link className="button ghost" href="/events">
                View Full Schedule
              </Link>
            </div>

            <dl className="heroStats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>

            <address className="address">
              <MapPin aria-hidden="true" />
              {SOCIETY.address}
            </address>
          </div>

          <aside className="heroCard" aria-label="Festival blessing">
            <Image
              className="heroMotif"
              src={asset("/ganpati-circular-theme.svg")}
              width={240}
              height={240}
              alt="ganpati circular motif"
              aria-hidden="true"
              priority
            />
            <p className="heroCardMantra" lang="sa">
              श्री गणेशाय नमः ||
            </p>
            <p>May wisdom guide us and togetherness inspire us.</p>
            <Image
              className="heroLogo"
              src={asset("/austin-arena-logo-white.svg")}
              width={357}
              height={116}
              alt={`${SOCIETY.name} logo`}
            />
          </aside>
        </div>
      </section>
    </>
  );
}

