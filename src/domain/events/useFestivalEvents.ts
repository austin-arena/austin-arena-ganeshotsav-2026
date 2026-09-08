"use client";

import { useEffect, useState } from "react";
import { fetchEventsFromSheet } from "./client-source";
import { isSheetConfigured } from "./config";
import { buildFestivalEventsData } from "./service";
import type { FestivalEventsData } from "./types";

export type EventsRefreshStatus = "idle" | "refreshing" | "live" | "error";

export interface UseFestivalEventsResult {
  data: FestivalEventsData;
  status: EventsRefreshStatus;
}

/**
 * Seeds from the build-time snapshot (instant paint + SEO), then refetches the
 * live sheet in the browser on mount — i.e. on every page load. A failed
 * refresh keeps the seed on screen so the page is never empty.
 *
 * When no browser-visible sheet URL is configured (no `NEXT_PUBLIC_GOOGLE_SHEET_*`
 * variable), the live refresh is skipped and the build-time seed is used as-is.
 */
export function useFestivalEvents(seed: FestivalEventsData): UseFestivalEventsResult {
  const [data, setData] = useState(seed);
  const [status, setStatus] = useState<EventsRefreshStatus>(() =>
    isSheetConfigured() ? "refreshing" : "idle",
  );

  useEffect(() => {
    // Nothing to refresh from in the browser — keep the seed silently.
    if (!isSheetConfigured()) {
      return;
    }

    const controller = new AbortController();

    fetchEventsFromSheet(controller.signal)
      .then(({ events, meta }) => {
        setData(buildFestivalEventsData(events, meta));
        setStatus("live");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("[events] Live refresh failed; keeping the published copy.", error);
        setStatus("error");
      });

    return () => controller.abort();
  }, []);

  return { data, status };
}

