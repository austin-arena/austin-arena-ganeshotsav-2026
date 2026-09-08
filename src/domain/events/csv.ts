/**
 * Minimal RFC 4180 CSV parser.
 *
 * Written without dependencies so it runs identically in Node during
 * `next build` and in the browser on the live-refresh fetch.
 */

export type CsvRow = Record<string, string>;

/** Splits raw CSV text into a matrix of cells, honouring quotes and newlines. */
export function parseCsvMatrix(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const rows: string[][] = [];

  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/**
 * Parses CSV text into objects keyed by the header row.
 * Header keys are trimmed; duplicate headers keep the first occurrence.
 */
export function parseCsv(input: string): CsvRow[] {
  const [header, ...body] = parseCsvMatrix(input);

  if (!header) {
    return [];
  }

  const keys = header.map((key) => key.trim());

  return body.map((cells) => {
    const record: CsvRow = {};

    keys.forEach((key, index) => {
      if (key && !(key in record)) {
        record[key] = (cells[index] ?? "").trim();
      }
    });

    return record;
  });
}

