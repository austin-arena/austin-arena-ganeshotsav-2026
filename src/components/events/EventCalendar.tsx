import { Clock3, MapPin } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import type { CalendarDay } from "@/domain/events/types";

interface EventCalendarProps {
  days: CalendarDay[];
}

const TIMING_LABEL: Record<CalendarDay["timing"], string> = {
  today: "Today",
  upcoming: "Upcoming",
  past: "Done",
};

/**
 * Compact day-by-day view of the whole festival.
 * Renders as a definition-style list so it stays readable on narrow screens.
 */
export default function EventCalendar({ days }: EventCalendarProps) {
  if (days.length === 0) {
    return (
      <EmptyState
        title="The calendar is being finalised"
        text="The committee will publish the day-wise schedule shortly."
      />
    );
  }

  return (
    <ol className="calendar" role="list">
      {days.map((day) => (
        <li key={day.dateISO} className={`calendarDay is-${day.timing}`}>
          <div className="calendarDate">
            <time dateTime={day.dateISO}>
              <span className="calendarDayNumber">{day.shortDateLabel}</span>
              <span className="calendarWeekday">{day.day}</span>
            </time>
            <span className={`calendarBadge status-${day.timing}`}>{TIMING_LABEL[day.timing]}</span>
          </div>

          <ul className="calendarEvents" role="list">
            {day.events.map((event) => (
              <li key={event.id} className={event.lifecycle === "cancelled" ? "isCancelled" : ""}>
                <span className="calendarEventName">{event.name}</span>
                <span className="calendarEventMeta">
                  {event.time ? (
                    <span>
                      <Clock3 aria-hidden="true" />
                      {event.time}
                    </span>
                  ) : null}
                  <span>
                    <MapPin aria-hidden="true" />
                    {event.venue}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

