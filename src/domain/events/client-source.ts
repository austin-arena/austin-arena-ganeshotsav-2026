"use client";

import { parseCsv } from "./csv";
import { getSheetCsvUrl } from "./config";
import { mapSheetRows } from "./mapper";
import type { EventRecord, EventSourceMeta } from "./types";

export interface ClientEventsResult {
  events: EventRecord[];
  meta: EventSourceMeta;
}

const FETCH_TIMEOUT_MS = 10_000;

/**
 * Fetches and maps the events sheet in the browser.
 *
 * Throws on any failure so the caller can keep the build-time seed on screen.
 * Uses the same parser and mapper as the server, so groupings stay identical.
 */
export async function fetchEventsFromSheet(signal?: AbortSignal): Promise<ClientEventsResult> {
  const url = getSheetCsvUrl();

  if (!url) {
    throw new Error("No public sheet URL configured.");
  }

  // Cache-bust so a refresh always sees the latest sheet, never a cached copy.
  const separator = url.includes("?") ? "&" : "?";
  const requestUrl = `${url}${separator}_=${Date.now()}`;

  const response = await fetch(requestUrl, {
    headers: { Accept: "text/csv,text/plain,*/*" },
    signal: signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google Sheet responded with ${response.status}`);
  }

  const csv = await response.text();

  // A sheet that is not shared publicly returns an HTML sign-in page.
  if (/^\s*</.test(csv)) {
    throw new Error("Google Sheet is not publicly readable (received HTML, not CSV).");
  }

  const { events } = mapSheetRows(parseCsv(csv));

  if (events.length === 0) {
    throw new Error("Google Sheet contained no usable event rows.");
  }

  return {
    events,
    meta: { source: "google-sheet", fetchedAt: new Date().toISOString() },
  };
}

