import type { RegistrationRecord } from "./schema";

export interface SinkResult {
  delivered: boolean;
  message: string;
}

/**
 * Registration sink.
 *
 * Default implementation forwards the record to a Google Apps Script Web App
 * that appends a row to a Google Sheet. Swap this single file to move to a
 * database, CRM, or email service without touching the UI.
 */
export async function submitRegistration(record: RegistrationRecord): Promise<SinkResult> {
  const endpoint = process.env.GOOGLE_SHEETS_WEBAPP_URL;

  if (!endpoint) {
    // Keeps local development and preview builds usable without secrets.
    console.info("[registration] GOOGLE_SHEETS_WEBAPP_URL not set. Record not persisted.", {
      event: record.eventName,
      submittedAt: record.submittedAt,
    });

    return {
      delivered: false,
      message: "Registration received. Sheet delivery is not configured on this environment.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.GOOGLE_SHEETS_SHARED_SECRET ?? "",
        ...record,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Sheet endpoint responded with ${response.status}`);
    }

    return { delivered: true, message: "Registration saved successfully." };
  } finally {
    clearTimeout(timeout);
  }
}

