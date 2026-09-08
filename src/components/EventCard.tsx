import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Link2,
  Mail,
  MapPin,
  Phone,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import RegisterLink from "@/components/events/RegisterLink";
import EventRules from "@/components/events/EventRules";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import type { FestivalEvent } from "@/domain/events/types";

interface EventCardProps {
  event: FestivalEvent;
  /** Renders the "fill the society form" shortcut. */
  showFormShortcut?: boolean;
  /** Elevates the card visually — used by the Today and Featured rails. */
  highlight?: boolean;
  /** Heading level so each section keeps a valid document outline. */
  headingLevel?: 2 | 3 | 4;
}

const TIMING_LABEL: Record<FestivalEvent["timing"], string> = {
  today: "Today",
  upcoming: "Upcoming",
  past: "Completed",
};

const LIFECYCLE_LABEL: Record<Exclude<FestivalEvent["lifecycle"], "scheduled">, string> = {
  cancelled: "Cancelled",
  postponed: "Postponed",
};

/** Detail row, rendered only when the sheet actually has a value. */
function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <span className="metaItem">
      <Icon aria-hidden="true" />
      <span className="srOnly">{label}: </span>
      {value}
    </span>
  );
}

export default function EventCard({
  event,
  showFormShortcut = false,
  highlight = false,
  headingLevel = 3,
}: EventCardProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const isCancelled = event.lifecycle === "cancelled";
  const canRegister = !isCancelled && event.timing !== "past";

  return (
    <article
      className={`eventCard is-${event.timing}${highlight ? " isHighlight" : ""}${
        isCancelled ? " isCancelled" : ""
      }`}
    >
      <div className="eventBand">
        <span className="eventCategory">{event.category}</span>

        <span className="eventBadges">
          {event.featured ? (
            <b className="statusPill status-featured">
              <Star aria-hidden="true" /> Featured
            </b>
          ) : null}

          {event.lifecycle === "scheduled" ? (
            <b className={`statusPill status-${event.timing}`}>{TIMING_LABEL[event.timing]}</b>
          ) : (
            <b className="statusPill status-alert">{LIFECYCLE_LABEL[event.lifecycle]}</b>
          )}
        </span>
      </div>

      <div className="eventBody">
        <Heading className="eventTitle">{event.name}</Heading>

        <p className="eventDescription">
          {event.description || "Full details will be shared by the committee soon."}
        </p>

        <div className="meta">
          <span className="metaItem">
            <CalendarDays aria-hidden="true" />
            <span className="srOnly">Date: </span>
            <time dateTime={event.dateISO}>{event.dateLabel}</time>
          </span>
          <Detail icon={Clock3} label="Time" value={event.time || "Time to be announced"} />
          <Detail icon={MapPin} label="Venue" value={event.venue} />
          <Detail icon={UserRound} label="Coordinator" value={event.coordinator} />
          <Detail icon={Users} label="Open to" value={event.ageGroup} />
        </div>

        {event.contact ? (
          <p className="eventContact">
            <span className="srOnly">Contact: {event.contact}</span>
            {event.contact.includes("@") ? (
              <a
                className="contactIcon"
                href={`mailto:${event.contact}`}
                aria-label={`Email ${event.contact}`}
              >
                <Mail aria-hidden="true" />
              </a>
            ) : (
              <>
                <a
                  className="contactIcon isCall"
                  href={`tel:${event.contact.replace(/[^\d+]/g, "")}`}
                  aria-label={`Call ${event.contact}`}
                >
                  <Phone aria-hidden="true" />
                </a>
                <a
                  className="contactIcon isWhatsapp"
                  href={`https://wa.me/${event.contact.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Message ${event.contact} on WhatsApp (opens in a new tab)`}
                >
                  <WhatsAppIcon />
                </a>
              </>
            )}
          </p>
        ) : null}

        {event.rules ? <EventRules text={event.rules} /> : null}

        {isCancelled ? (
          <div className="eventActions">
            <p className="eventNotice">This event has been cancelled.</p>
          </div>
        ) : event.link ? (
          <div className="eventActions">
            <a
              className="button"
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${event.linkLabel || "View Details"}: ${event.name} (opens in a new tab)`}
            >
              {event.linkLabel || "View Details"} <ExternalLink aria-hidden="true" />
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
