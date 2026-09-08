"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import EventCard from "@/components/EventCard";
import EmptyState from "@/components/common/EmptyState";
import type { EventTiming, FestivalEvent } from "@/domain/events/types";

type TimingFilter = "all" | EventTiming;

const TIMING_FILTERS: { value: TimingFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

interface EventsExplorerProps {
  events: FestivalEvent[];
  categories: string[];
}

export default function EventsExplorer({ events, categories }: EventsExplorerProps) {
  const [timing, setTiming] = useState<TimingFilter>("all");
  const [category, setCategory] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");

  // Keeps typing responsive on low-end phones by deferring the filtering pass.
  const deferredQuery = useDeferredValue(query);

  const counts = useMemo(
    () => ({
      all: events.length,
      today: events.filter((event) => event.timing === "today").length,
      upcoming: events.filter((event) => event.timing === "upcoming").length,
      past: events.filter((event) => event.timing === "past").length,
    }),
    [events],
  );

  const dateBounds = useMemo(
    () => ({
      min: events[0]?.dateISO ?? "",
      max: events[events.length - 1]?.dateISO ?? "",
    }),
    [events],
  );

  const visibleEvents = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();

    return events.filter((event) => {
      if (timing !== "all" && event.timing !== timing) return false;
      if (category !== "all" && event.category !== category) return false;
      if (fromDate && event.dateISO < fromDate) return false;
      if (toDate && event.dateISO > toDate) return false;
      if (!needle) return true;

      return [
        event.name,
        event.venue,
        event.category,
        event.coordinator,
        event.description,
        event.ageGroup ?? "",
        event.dateLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [events, timing, category, fromDate, toDate, deferredQuery]);

  const hasFilters =
    timing !== "all" || category !== "all" || Boolean(fromDate || toDate || query.trim());

  const resetFilters = () => {
    setTiming("all");
    setCategory("all");
    setFromDate("");
    setToDate("");
    setQuery("");
  };

  return (
    <div className="explorer">
      <div className="explorerBar">
        <div className="filterGroup" role="group" aria-label="Filter events by status">
          {TIMING_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`filterChip${timing === value ? " active" : ""}`}
              aria-pressed={timing === value}
              onClick={() => setTiming(value)}
            >
              {label} <span>{counts[value]}</span>
            </button>
          ))}
        </div>

        <div className="searchField">
          <Search aria-hidden="true" />
          <input
            id="event-search"
            type="search"
            value={query}
            onChange={(changeEvent) => setQuery(changeEvent.target.value)}
            placeholder="Search event, venue or coordinator"
            aria-label="Search events"
            enterKeyHint="search"
          />
        </div>
      </div>

      <div className="advancedFilters">
        <p className="advancedFiltersLabel">
          <SlidersHorizontal aria-hidden="true" /> Refine
        </p>

        <div className="filterField">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            value={category}
            onChange={(changeEvent) => setCategory(changeEvent.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="filterField">
          <label htmlFor="filter-from">From date</label>
          <input
            id="filter-from"
            type="date"
            value={fromDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(changeEvent) => setFromDate(changeEvent.target.value)}
          />
        </div>

        <div className="filterField">
          <label htmlFor="filter-to">To date</label>
          <input
            id="filter-to"
            type="date"
            value={toDate}
            min={fromDate || dateBounds.min}
            max={dateBounds.max}
            onChange={(changeEvent) => setToDate(changeEvent.target.value)}
          />
        </div>

        {hasFilters ? (
          <button type="button" className="clearFilters" onClick={resetFilters}>
            <X aria-hidden="true" /> Clear filters
          </button>
        ) : null}
      </div>

      <p className="resultCount" role="status">
        Showing {visibleEvents.length} of {events.length} events
      </p>

      {visibleEvents.length === 0 ? (
        <EmptyState
          title="No matching events"
          text="Try a different category, widen the date range, or clear the search."
          action={
            <button type="button" className="button ghostBtn" onClick={resetFilters}>
              Clear all filters
            </button>
          }
        />
      ) : (
        <ul className="cardGrid" role="list">
          {visibleEvents.map((event) => (
            <li key={event.id}>
              <EventCard event={event} showFormShortcut />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
