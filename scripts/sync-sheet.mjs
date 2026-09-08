/**
 * Downloads the live Google Sheet and refreshes the committed CSV snapshot.
 *
 * Usage:
 *   npm run data:sync
 *
 * Reads GOOGLE_SHEET_CSV_URL, or GOOGLE_SHEET_ID (+ optional GOOGLE_SHEET_GID
 * / GOOGLE_SHEET_NAME) from the environment or .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAndValidateEventsCsv, printWarnings, writeJsonOutput } from "./event-csv-utils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Minimal .env.local reader so the script works without extra dependencies. */
function loadEnvFile() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function resolveCsvUrl() {
  if (process.env.GOOGLE_SHEET_CSV_URL) {
    return process.env.GOOGLE_SHEET_CSV_URL;
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return null;

  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
  url.searchParams.set("tqx", "out:csv");

  if (process.env.GOOGLE_SHEET_GID) {
    url.searchParams.set("gid", process.env.GOOGLE_SHEET_GID);
  } else if (process.env.GOOGLE_SHEET_NAME) {
    url.searchParams.set("sheet", process.env.GOOGLE_SHEET_NAME);
  }

  return url.toString();
}

loadEnvFile();

const csvUrl = resolveCsvUrl();

if (!csvUrl) {
  console.error(
    "No sheet configured. Set GOOGLE_SHEET_CSV_URL or GOOGLE_SHEET_ID in .env.local first.",
  );
  process.exit(1);
}

const response = await fetch(csvUrl, { headers: { Accept: "text/csv" } });

if (!response.ok) {
  console.error(`Google Sheet request failed with ${response.status}.`);
  process.exit(1);
}

const csv = await response.text();

if (/^\s*</.test(csv)) {
  console.error(
    'Received HTML instead of CSV. Share the sheet as "Anyone with the link – Viewer".',
  );
  process.exit(1);
}

const csvFilePath = path.join(root, "src", "data", "events.csv");
fs.writeFileSync(csvFilePath, csv.endsWith("\n") ? csv : `${csv}\n`, "utf8");

const { rows, warnings } = loadAndValidateEventsCsv(csvFilePath);
printWarnings(warnings);
writeJsonOutput(rows, path.join(root, "src", "data", "events.fallback.json"));

console.log(`Synced ${rows.length} rows from Google Sheets into src/data/events.csv`);

