/**
 * Text normalisation helpers.
 *
 * Spreadsheet data frequently arrives as machine-ish tokens such as
 * `singing_competition`, `KIDS-DRAWING` or `  extra   spaces `. These helpers
 * turn that into presentation-ready copy so the UI never renders underscores.
 */

/** Words that stay lowercase inside a title (unless first or last). */
const MINOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "from",
  "in",
  "nor",
  "of",
  "on",
  "or",
  "per",
  "the",
  "to",
  "via",
  "vs",
  "with",
]);

/** Tokens that should always render fully uppercase. */
const ACRONYMS = new Set(["dj", "vip", "qr", "rsvp", "id", "tv", "ac"]);

/** Collapses whitespace and trims. */
export function squish(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Converts `singing_competition` / `kids-drawing` into `Singing Competition`. */
export function toTitleCase(value: string): string {
  const words = value.split(" ").filter(Boolean);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();

      if (ACRONYMS.has(lower)) {
        return lower.toUpperCase();
      }

      if (index > 0 && index < words.length - 1 && MINOR_WORDS.has(lower)) {
        return lower;
      }

      // Preserve internal punctuation: "ganesh-sthapana" -> "Ganesh-Sthapana".
      return lower.replace(/(^|[^a-z0-9'])([a-z])/g, (_match, prefix: string, letter: string) => {
        return `${prefix}${letter.toUpperCase()}`;
      });
    })
    .join(" ");
}

/**
 * Cleans a spreadsheet value for display.
 *
 * - strips underscores used as word separators
 * - normalises stray whitespace and repeated separators
 * - title-cases values that arrive without any capitalisation
 *
 * Human-written sentences (which already contain capitals) keep their casing.
 */
export function humanize(value: unknown): string {
  const raw = squish(value);

  if (!raw) {
    return "";
  }

  const cleaned = squish(
    raw
      // `snake_case` and `kebab_case` separators become spaces.
      .replace(/[_]+/g, " ")
      // A hyphen surrounded by letters on both sides is a real hyphen; a hyphen
      // used as a separator between words with spaces is normalised to an en dash.
      .replace(/\s+-\s+/g, " – "),
  );

  const hasUppercase = /[A-Z]/.test(cleaned);
  const hasLowercase = /[a-z]/.test(cleaned);

  // ALL CAPS values ("TALENT NIGHT") and all-lowercase slugs both get title cased.
  if (!hasUppercase || !hasLowercase) {
    return toTitleCase(cleaned);
  }

  return cleaned;
}

/** Like {@link humanize} but returns `undefined` for blank values. */
export function humanizeOptional(value: unknown): string | undefined {
  return humanize(value) || undefined;
}

/** URL-safe identifier fragment. */
export function slugify(value: string): string {
  return squish(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Truthy-ish spreadsheet flags: `yes`, `y`, `true`, `1`, `x`, `✓`. */
export function toBoolean(value: unknown): boolean {
  const normalized = squish(value).toLowerCase();
  return ["yes", "y", "true", "1", "x", "✓", "featured"].includes(normalized);
}

