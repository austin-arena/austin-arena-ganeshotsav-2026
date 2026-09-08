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
 * safe because the sheet is a public, read-only "Publish to web" resource — it
 * exposes nothing private.
 *
 * Environment variables (`NEXT_PUBLIC_GOOGLE_SHEET_*`) still take priority, so a
 * fork can point at a different sheet without editing code.
 *
 * Note: a `/pub?output=csv` link is cached by Google for a few minutes. To make
 * edits appear almost instantly, set `FALLBACK_SHEET_ID` + `FALLBACK_SHEET_GID`
 * instead (leave `FALLBACK_SHEET_CSV_URL` empty) — that builds a `gviz/tq` URL,
 * which reflects changes immediately.
 */
const FALLBACK_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSPlAeXrzC_nWNBJ4P37pSJPIBGMjGVpxsBMd4sVMe-44hMKp4Ho89ra_j8UjryIWiwsOxVhLkwUH8G/pub?gid=0&single=true&output=csv";
const FALLBACK_SHEET_ID = "2PACX-1vSPlAeXrzC_nWNBJ4P37pSJPIBGMjGVpxsBMd4sVMe-44hMKp4Ho89ra_j8UjryIWiwsOxVhLkwUH8G";
const FALLBACK_SHEET_GID = "";

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
 * `NEXT_PUBLIC_` variables are read first because the same lookup runs in the
 * browser, where only `NEXT_PUBLIC_` values exist. Falls back to the committed
 * constants above. Accepts either a full published-CSV URL or a sheet id plus
 * optional tab name / gid. Returns `null` when nothing is configured, in which
 * case the committed snapshot is used.
 */
export function getSheetCsvUrl(): string | null {
  const directUrl =
    readEnv("NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL", "GOOGLE_SHEET_CSV_URL") || FALLBACK_SHEET_CSV_URL;

  if (directUrl) {
    return directUrl;
  }

  const sheetId = readEnv("NEXT_PUBLIC_GOOGLE_SHEET_ID", "GOOGLE_SHEET_ID") || FALLBACK_SHEET_ID;

  if (!sheetId) {
    return null;
  }

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

export function isSheetConfigured(): boolean {
  return getSheetCsvUrl() !== null;
}
