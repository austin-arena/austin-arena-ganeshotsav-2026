/**
 * Google Sheets data-source configuration.
 *
 * The site is a fully static GitHub Pages export. The sheet is read at build
 * time for the initial HTML, and again in the browser on every page load so
 * committee edits appear on refresh without a redeploy.
 */

/**
 * Committed fallback for the events sheet, so every build (local and CI) can
 * reach it without any `.env` setup or GitHub repository variables. This is
 * safe because the sheet is public and read-only — it exposes nothing private.
 *
 * Environment variables (`NEXT_PUBLIC_GOOGLE_SHEET_*`) still take priority, so a
 * fork can point at a different sheet without editing code.
 *
 * We use the sheet **id + gid** (the `gviz/tq` endpoint), which reads the sheet
 * live and reflects edits within seconds. The older `/pub?output=csv` link is
 * avoided because Google republishes it on a ~5-minute schedule and serves it
 * from several caches, which makes edits appear then disappear ("flicker").
 */
const FALLBACK_SHEET_ID = "1E5QkRZhsGpp21oaQI8p3VxhegzIEe1YiBFyX-kpuWYo";
const FALLBACK_SHEET_GID = "0";
/** Optional full published-CSV URL. Leave empty when using the id above. */
const FALLBACK_SHEET_CSV_URL = "";

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
 * Priority: an explicit env CSV URL, then a sheet id (env or committed) turned
 * into the live `gviz` endpoint, then a committed published-CSV URL. `NEXT_PUBLIC_`
 * names are read first because this also runs in the browser. Returns `null`
 * only when nothing is configured, in which case the committed snapshot is used.
 */
export function getSheetCsvUrl(): string | null {
  // 1. Explicit full CSV URL from the environment (highest priority).
  const envUrl = readEnv("NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL", "GOOGLE_SHEET_CSV_URL");
  if (envUrl) {
    return envUrl;
  }

  // 2. Sheet id (env, else committed) → live `gviz` endpoint (preferred).
  const sheetId = readEnv("NEXT_PUBLIC_GOOGLE_SHEET_ID", "GOOGLE_SHEET_ID") || FALLBACK_SHEET_ID;
  if (sheetId) {
    const gid = readEnv("NEXT_PUBLIC_GOOGLE_SHEET_GID", "GOOGLE_SHEET_GID") || FALLBACK_SHEET_GID;
    const sheetName = readEnv("NEXT_PUBLIC_GOOGLE_SHEET_NAME", "GOOGLE_SHEET_NAME");

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

  // 3. Committed published-CSV URL (last resort).
  return FALLBACK_SHEET_CSV_URL || null;
}

export function isSheetConfigured(): boolean {
  return getSheetCsvUrl() !== null;
}
