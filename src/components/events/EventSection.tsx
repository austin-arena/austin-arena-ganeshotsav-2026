import type { ReactNode } from "react";
import EventCard from "@/components/EventCard";
import EmptyState from "@/components/common/EmptyState";
import SectionHeading from "@/components/common/SectionHeading";
import type { FestivalEvent } from "@/domain/events/types";

interface EventSectionProps {
  id: string;
  kicker: string;
  title: string;
  text?: string;
  events: FestivalEvent[];
  emptyTitle: string;
  emptyText: string;
  emptyAction?: ReactNode;
  /** Adds the society-form shortcut to each card (homepage only). */
  showFormShortcut?: boolean;
  highlightCards?: boolean;
  className?: string;
  align?: "left" | "center";
  footer?: ReactNode;
}

export default function EventSection({
  id,
  kicker,
  title,
  text,
  events,
  emptyTitle,
  emptyText,
  emptyAction,
  showFormShortcut = false,
  highlightCards = false,
  className,
  align = "center",
  footer,
}: EventSectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} className={`section ${className ?? ""}`.trim()} aria-labelledby={headingId}>
      <div className="container">
        <SectionHeading id={headingId} kicker={kicker} title={title} text={text} align={align} />

        {events.length === 0 ? (
          <EmptyState title={emptyTitle} text={emptyText} action={emptyAction} />
        ) : (
          <ul className="cardGrid" role="list">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  showFormShortcut={showFormShortcut}
                  highlight={highlightCards}
                />
              </li>
            ))}
          </ul>
        )}

        {footer}
      </div>
    </section>
  );
}
