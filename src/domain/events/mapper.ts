import { humanize, humanizeOptional, slugify, squish, toBoolean } from "./text";
import type { EventLifecycle, EventRecord, EventSheetRow } from "./types";
import { formatWeekday, sortByDateTime } from "./utils";

/**
 * Column aliases.
 *
 * The committee's sheet is the source of truth, so we accept a few spellings
 * per field. Lookup is case/space/underscore insensitive.
 */
const COLUMN_ALIASES = {
  date: ["date", "eventdate"],
  day: ["day", "weekday"],
  time: ["time", "timing", "starttime"],
  name: ["event", "eventname", "name", "title", "program", "programme"],
  category: ["category", "type", "eventtype"],
  description: ["details", "description", "about", "detail"],
  participants: ["participants", "participant", "who", "openfor"],
  ageGroup: ["agegroup", "age", "ages"],
  venue: ["venue", "location", "place"],
  coordinator: ["volunteercoordinator", "coordinator", "volunteer", "incharge", "contactperson"],
  contact: ["contact", "contactnumber", "phone", "mobile", "email"],
  rules: ["rules", "guidelines", "note", "notes"],
  registration: ["registration", "registrationlink", "register", "registerlink", "form"],
  link: ["link", "eventlink", "morelink", "moreinfo", "infolink", "url", "page", "website"],
  linkLabel: ["linklabel", "linktext", "linkname", "linktitle", "actionlabel", "buttonlabel"],
  featured: ["featured", "highlight", "highlighted", "ispinned", "pinned"],
  lifecycle: ["status", "eventstatus", "state"],
} as const;

type FieldName = keyof typeof COLUMN_ALIASES;

export interface RowIssue {
  row: number;
  message: string;
}

export interface MapResult {
  events: EventRecord[];
  issues: RowIssue[];
}

/** `Volunteer / Coordinator` -> `volunteercoordinator` */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildLookup(row: EventSheetRow): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeKey(key);
    if (normalized && !lookup.has(normalized)) {
      lookup.set(normalized, value ?? "");
    }
  }

  return lookup;
}

function readField(lookup: Map<string, string>, field: FieldName): string {
  for (const alias of COLUMN_ALIASES[field]) {
    const value = lookup.get(alias);
    if (value !== undefined && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
}

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  sept: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

/**
 * Normalises the many shapes a spreadsheet date can take into `YYYY-MM-DD`.
 * Day-first is assumed for ambiguous numeric dates (Indian convention).
 */
export function normalizeDate(value: string): string {
  const text = squish(value);

  if (!text) {
    return "";
  }

  // Already ISO.
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }

  // 14/09/2026 or 14-9-26 (day first).
  const numeric = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (numeric) {
    const day = numeric[1].padStart(2, "0");
    const month = numeric[2].padStart(2, "0");
    const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
    return `${year}-${month}-${day}`;
  }

  // 14 Sep 2026 / 14 September 2026
  const dayFirst = text.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
  if (dayFirst) {
    const month = MONTHS[dayFirst[2].slice(0, 3).toLowerCase()];
    if (month) {
      return `${dayFirst[3]}-${month}-${dayFirst[1].padStart(2, "0")}`;
    }
  }

  // Sep 14, 2026
  const monthFirst = text.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].slice(0, 3).toLowerCase()];
    if (month) {
      return `${monthFirst[3]}-${month}-${monthFirst[2].padStart(2, "0")}`;
    }
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
}

/** Tidies time ranges: `6:30 pm-8 pm` -> `6:30 PM – 8 PM`. */
export function normalizeTime(value: string): string {
  const text = squish(value)
    .replace(/[–—]/g, "-")
    .replace(/\s*-\s*/g, " – ")
    .replace(/\b(a\.?m\.?|p\.?m\.?)\b/gi, (match) => match.replace(/\./g, "").toUpperCase());

  return text;
}

/** Keyword-based category fallback for sheets without a Category column. */
function inferCategory(name: string, description: string): string {
  const haystack = `${name} ${description}`.toLowerCase();

  const rules: [RegExp, string][] = [
    [/aarti|puja|pooja|visarjan|sthapana|abhishek|darshan|mantra/, "Puja"],
    [/kid|child|drawing|colour|color|fancy dress|rangoli/, "Kids"],
    [/bhajan|dance|music|sing|talent|cultural|drama|skit|garba|dhol/, "Cultural"],
    [/modak|prasad|food|recipe|cook|mahaprasad|bhandara/, "Food"],
    [/volunteer|orientation|meeting|briefing|committee/, "Volunteer"],
    [/sport|game|race|cricket|antakshari|quiz|tournament/, "Games"],
  ];

  for (const [pattern, category] of rules) {
    if (pattern.test(haystack)) {
      return category;
    }
  }

  return "Community";
}

/** Pulls a phone number or email out of a free-text coordinator cell. */
function inferContact(coordinator: string): string | undefined {
  const email = coordinator.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email) {
    return email[0].toLowerCase();
  }

  const phone = coordinator.match(/(\+?\d[\d\s-]{8,}\d)/);
  if (phone) {
    return squish(phone[1]);
  }

  return undefined;
}

/** Strips a trailing contact detail so the name reads cleanly. */
function cleanCoordinatorName(coordinator: string): string {
  return humanize(coordinator.replace(/[([]\s*[^)\]]*[)\]]\s*$/, ""));
}

function normalizeLifecycle(value: string): EventLifecycle {
  const normalized = value.toLowerCase();

  if (/cancel/.test(normalized)) {
    return "cancelled";
  }
  if (/postpon|reschedul|defer/.test(normalized)) {
    return "postponed";
  }

  return "scheduled";
}

function normalizeUrl(value: string): { url?: string; error?: string } {
  if (!value) {
    return {};
  }

  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { error: "Registration must be an http(s) link." };
    }
    return { url: parsed.toString() };
  } catch {
    return { error: "Registration must be a valid URL." };
  }
}

/**
 * Maps raw spreadsheet rows to normalised events.
 *
 * Invalid rows are skipped rather than throwing, so one bad row in the sheet
 * can never take the live site down. Issues are returned for logging.
 */
export function mapSheetRows(rows: EventSheetRow[]): MapResult {
  const issues: RowIssue[] = [];
  const events: EventRecord[] = [];
  const seenKeys = new Set<string>();
  const usedIds = new Set<string>();

  rows.forEach((row, index) => {
    // +2 accounts for the header row and 1-based spreadsheet numbering.
    const rowNumber = index + 2;
    const lookup = buildLookup(row);

    const name = humanize(readField(lookup, "name"));
    const dateISO = normalizeDate(readField(lookup, "date"));
    const venue = humanize(readField(lookup, "venue"));

    if (!name && !dateISO && !venue) {
      return; // Entirely blank row — ignore silently.
    }

    if (!name) {
      issues.push({ row: rowNumber, message: "Event name is required." });
      return;
    }
    if (!dateISO) {
      issues.push({ row: rowNumber, message: `Date is missing or unreadable for "${name}".` });
      return;
    }

    const time = normalizeTime(readField(lookup, "time"));
    const duplicateKey = `${dateISO}|${time}|${name.toLowerCase()}|${venue.toLowerCase()}`;

    if (seenKeys.has(duplicateKey)) {
      issues.push({ row: rowNumber, message: `Duplicate row skipped for "${name}".` });
      return;
    }
    seenKeys.add(duplicateKey);

    const rawCoordinator = readField(lookup, "coordinator");
    const description = squish(readField(lookup, "description"));
    const registrationRaw = readField(lookup, "registration");
    const { url: registrationLink, error: urlError } = normalizeUrl(registrationRaw);

    if (urlError) {
      issues.push({ row: rowNumber, message: `${urlError} (${name})` });
    }

    // Optional "more info" link. Non-critical: a bad value is dropped, not fatal.
    const { url: link } = normalizeUrl(readField(lookup, "link"));
    const linkLabel = link ? squish(readField(lookup, "linkLabel")) || undefined : undefined;

    const participants = humanizeOptional(readField(lookup, "participants"));

    let id = `${dateISO}-${slugify(name)}`;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${dateISO}-${slugify(name)}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    events.push({
      id,
      name,
      dateISO,
      day: humanize(readField(lookup, "day")) || formatWeekday(dateISO),
      time,
      venue: venue || "To be announced",
      category: humanize(readField(lookup, "category")) || inferCategory(name, description),
      description,
      coordinator: cleanCoordinatorName(rawCoordinator),
      contact: squish(readField(lookup, "contact")) || inferContact(rawCoordinator),
      participants,
      ageGroup: humanizeOptional(readField(lookup, "ageGroup")) ?? participants,
      rules: squish(readField(lookup, "rules")) || undefined,
      registrationLink,
      link,
      linkLabel,
      featured: toBoolean(readField(lookup, "featured")),
      lifecycle: normalizeLifecycle(readField(lookup, "lifecycle")),
    });
  });

  return { events: events.sort(sortByDateTime), issues };
}

