import fallbackRows from "@/data/events.fallback.json";
import { parseCsv } from "./csv";
import { EVENTS_REVALIDATE_SECONDS, getSheetCsvUrl } from "./config";
import { mapSheetRows } from "./mapper";
import type { EventRecord, EventSheetRow, EventSourceMeta } from "./types";

export interface EventSourceResult {
  events: EventRecord[];
  meta: EventSourceMeta;
}

const FETCH_TIMEOUT_MS = 10_000;

function mapWithLogging(rows: EventSheetRow[], origin: string): EventRecord[] {
  const { events, issues } = mapSheetRows(rows);

  if (issues.length > 0) {
    console.warn(
      `[events] ${issues.length} row issue(s) in ${origin}:\n` +
        issues.map((issue) => `  - Row ${issue.row}: ${issue.message}`).join("\n"),
    );
  }

  return events;
}

/** Reads the committed CSV snapshot that ships with the deployment. */
function readFallback(warning?: string): EventSourceResult {
  return {
    events: mapWithLogging(fallbackRows as EventSheetRow[], "local fallback data"),
    meta: {
      source: "local-fallback",
      fetchedAt: new Date().toISOString(),
      warning,
    },
  };
}

/**
 * Loads events from the Google Sheet, falling back to the committed snapshot.
 *
 * The fetch is cached by Next.js and revalidated in the background, which keeps
 * pages static while letting the committee edit the sheet without a redeploy.
 */
export async function loadEvents(): Promise<EventSourceResult> {
  const csvUrl = getSheetCsvUrl();

  if (!csvUrl) {
    return readFallback();
  }

  try {
    const response = await fetch(csvUrl, {
      headers: { Accept: "text/csv,text/plain,*/*" },
      next: { revalidate: EVENTS_REVALIDATE_SECONDS, tags: ["events"] },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Google Sheet responded with ${response.status}`);
    }

    const csv = await response.text();

    // A sheet that is not shared publicly returns an HTML sign-in page.
    if (/^\s*</.test(csv)) {
      throw new Error("Google Sheet is not publicly readable (received HTML, not CSV).");
    }

    const events = mapWithLogging(parseCsv(csv), "Google Sheet");

    if (events.length === 0) {
      throw new Error("Google Sheet contained no usable event rows.");
    }

    return {
      events,
      meta: { source: "google-sheet", fetchedAt: new Date().toISOString() },
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    console.error(`[events] Falling back to committed data. Reason: ${reason}`);

    return readFallback(
      "Live schedule could not be loaded. Showing the last published version.",
    );
  }
}

