import type { FestivalEvent } from "@/domain/events/types";
import { SITE_URL, SOCIETY } from "@/config/site";

interface EventsJsonLdProps {
  events: FestivalEvent[];
}

/**
 * schema.org `Event` markup, emitted as an ItemList so search engines can show
 * the festival schedule as rich results.
 */
export default function EventsJsonLd({ events }: EventsJsonLdProps) {
  if (events.length === 0) {
    return null;
  }

  const payload = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SOCIETY.name} ${SOCIETY.festival} schedule`,
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: event.name,
        startDate: event.dateISO,
        eventStatus:
          event.lifecycle === "cancelled"
            ? "https://schema.org/EventCancelled"
            : event.lifecycle === "postponed"
              ? "https://schema.org/EventPostponed"
              : "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        description: event.description || `${event.name} at ${SOCIETY.name}.`,
        location: {
          "@type": "Place",
          name: event.venue,
          address: {
            "@type": "PostalAddress",
            streetAddress: SOCIETY.address,
            addressLocality: SOCIETY.locality,
            addressRegion: SOCIETY.region,
            postalCode: SOCIETY.postalCode,
            addressCountry: SOCIETY.country,
          },
        },
        organizer: {
          "@type": "Organization",
          name: SOCIETY.committee,
          url: SITE_URL,
        },
        ...(event.registrationLink ? { url: event.registrationLink } : { url: `${SITE_URL}/events` }),
        isAccessibleForFree: true,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Serialised server-side from trusted sheet data.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

