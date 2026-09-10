"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
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

    const counts = useMemo(
        () => ({
            all: events.length,
            today: events.filter((event) => event.timing === "today").length,
            upcoming: events.filter((event) => event.timing === "upcoming").length,
            past: events.filter((event) => event.timing === "past").length,
        }),
        [events],
    );

    const visibleEvents = useMemo(() => {
        return events.filter((event) => {
            if (timing !== "all" && event.timing !== timing) return false;
            if (category !== "all" && event.category !== category) return false;
            return true;
        });
    }, [events, timing, category]);

    const hasFilters = timing !== "all" || category !== "all";

    const resetFilters = () => {
        setTiming("all");
        setCategory("all");
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

                {/* search field removed per design */}
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
                    text="Try a different category or clear the filters."
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
