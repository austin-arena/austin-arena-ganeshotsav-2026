import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

/**
 * Build-time CSV tooling.
 *
 * These scripts only *validate* the sheet export and write the rows out
 * verbatim. All normalisation (underscore cleanup, date parsing, category
 * inference) lives in `src/domain/events/mapper.ts` so that the Google Sheet
 * and the committed fallback are processed by exactly the same code.
 */

const REQUIRED_COLUMNS = ["Date", "Event", "Venue"];

const KNOWN_COLUMNS = [
  "Date",
  "Day",
  "Time",
  "Event",
  "Category",
  "Details",
  "Participants",
  "Age Group",
  "Venue",
  "Volunteer / Coordinator",
  "Contact",
  "Rules",
  "Registration",
  "Featured",
  "Status",
];

function normalizeKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findColumn(headers, name) {
  const target = normalizeKey(name);
  return headers.find((header) => normalizeKey(header) === target);
}

function normalizeDate(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }

  const numeric = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (numeric) {
    const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
    return `${year}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function validate(records, headers) {
  const errors = [];
  const warnings = [];
  const seen = new Set();

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !findColumn(headers, column));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required column(s): ${missingColumns.join(", ")}`);
  }

  const unknown = headers.filter(
    (header) => header && !KNOWN_COLUMNS.some((known) => normalizeKey(known) === normalizeKey(header)),
  );
  if (unknown.length > 0) {
    warnings.push(`Unrecognised column(s) will be ignored: ${unknown.join(", ")}`);
  }

  const dateKey = findColumn(headers, "Date");
  const eventKey = findColumn(headers, "Event");
  const venueKey = findColumn(headers, "Venue");
  const timeKey = findColumn(headers, "Time");
  const registrationKey = findColumn(headers, "Registration");

  records.forEach((record, index) => {
    const row = index + 2;
    const dateISO = normalizeDate(record[dateKey]);
    const name = String(record[eventKey] ?? "").trim();
    const venue = String(record[venueKey] ?? "").trim();
    const time = String(record[timeKey] ?? "").trim();
    const registration = String(record[registrationKey] ?? "").trim();

    if (!dateISO) errors.push(`Row ${row}: Date is missing or invalid.`);
    if (!name) errors.push(`Row ${row}: Event is required.`);
    if (!venue) warnings.push(`Row ${row}: Venue is empty, "To be announced" will be shown.`);

    if (registration) {
      const candidate = /^https?:\/\//i.test(registration) ? registration : `https://${registration}`;
      try {
        new URL(candidate);
      } catch {
        errors.push(`Row ${row}: Registration must be a valid URL.`);
      }
    }

    const key = `${dateISO}|${time}|${name.toLowerCase()}|${venue.toLowerCase()}`;
    if (seen.has(key)) {
      errors.push(`Row ${row}: Duplicate event for the same Date + Time + Event + Venue.`);
    }
    seen.add(key);
  });

  if (errors.length > 0) {
    throw new Error(`Event CSV validation failed:\n- ${errors.join("\n- ")}`);
  }

  return warnings;
}

/** Parses, validates and returns the raw rows plus any non-fatal warnings. */
export function loadAndValidateEventsCsv(csvFilePath) {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`Event CSV not found at ${csvFilePath}`);
  }

  const records = parse(fs.readFileSync(csvFilePath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  const headers = Object.keys(records[0] ?? {});
  const warnings = validate(records, headers);

  return { rows: records, warnings };
}

export function writeJsonOutput(rows, outputFilePath) {
  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  fs.writeFileSync(outputFilePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}

export function printWarnings(warnings) {
  warnings.forEach((warning) => console.warn(`  warning: ${warning}`));
}
