/**
 * Google Sheets data-source configuration.
 *
 * The site stays fully static: the sheet is read at build time and refreshed in
 * the background by Incremental Static Regeneration, so no backend is required.
 */

/** How long a generated page may serve before Next.js refetches the sheet. */
export const EVENTS_REVALIDATE_SECONDS = Number(
  process.env.EVENTS_REVALIDATE_SECONDS ?? 300,
);

function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

/**
 * Resolves the CSV endpoint for the events sheet.
 *
 * Accepts either a full published-CSV URL or a sheet id plus optional tab
 * name / gid. Returns `null` when the sheet is not configured, in which case
 * the committed fallback data is used.
 */
export function getSheetCsvUrl(): string | null {
  const directUrl = readEnv("GOOGLE_SHEET_CSV_URL", "NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL");

  if (directUrl) {
    return directUrl;
  }

  const sheetId = readEnv("GOOGLE_SHEET_ID", "NEXT_PUBLIC_GOOGLE_SHEET_ID");

  if (!sheetId) {
    return null;
  }

  const gid = readEnv("GOOGLE_SHEET_GID");
  const sheetName = readEnv("GOOGLE_SHEET_NAME");

  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq`,
  );
  url.searchParams.set("tqx", "out:csv");

  if (gid) {
    url.searchParams.set("gid", gid);
  } else if (sheetName) {
    url.searchParams.set("sheet", sheetName);
  }

  return url.toString();
}

export function isSheetConfigured(): boolean {
  return getSheetCsvUrl() !== null;
}

