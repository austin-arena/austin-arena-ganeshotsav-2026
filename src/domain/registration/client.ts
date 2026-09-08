"use client";

import { validateRegistration, type ValidationErrors } from "./schema";

export interface SubmitResult {
  ok: boolean;
  message: string;
  errors?: ValidationErrors;
}

/**
 * Direct Google Apps Script endpoint. The site is a static export, so the
 * browser always submits here — there is no server route.
 */
const STATIC_ENDPOINT = process.env.NEXT_PUBLIC_REGISTRATION_ENDPOINT ?? "";

/** Optional secret. On a static host this is public — see the README. */
const STATIC_SECRET = process.env.NEXT_PUBLIC_REGISTRATION_SECRET ?? "";


/**
 * Posts to the Apps Script Web App.
 *
 * `text/plain` keeps this a CORS "simple request" so the browser does not send
 * a preflight, which Apps Script cannot answer. If the response is unreadable
 * because of CORS we retry opaquely — the row is still written server-side.
 */
async function submitToAppsScript(record: unknown): Promise<SubmitResult> {
  const body = JSON.stringify({ secret: STATIC_SECRET, ...(record as object) });

  try {
    const response = await fetch(STATIC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
    });

    const result = (await response.json()) as { ok?: boolean; message?: string };

    if (result.ok === false) {
      return { ok: false, message: result.message ?? "The registration could not be saved." };
    }

    return { ok: true, message: "Registration saved successfully." };
  } catch {
    // The response could not be read (opaque redirect or CORS). Send once more
    // in no-cors mode so the submission is not lost.
    try {
      await fetch(STATIC_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body,
      });

      return { ok: true, message: "Registration submitted." };
    } catch {
      return {
        ok: false,
        message: "Network error. Please check your connection and try again.",
      };
    }
  }
}

/**
 * Single submission entry point for the UI.
 *
 * The site is a static export, so there is no server: the payload is validated
 * in the browser and posted directly to the Apps Script Web App.
 */
export async function submitRegistrationForm(payload: unknown): Promise<SubmitResult> {
  const { errors, data } = validateRegistration(payload);

  if (!data) {
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }

  if (!STATIC_ENDPOINT) {
    // No endpoint configured: accept the entry so the form is never a dead end,
    // and make it obvious that nothing was persisted.
    console.warn(
      "[registration] NEXT_PUBLIC_REGISTRATION_ENDPOINT is not set — the submission was not saved.",
    );

    return {
      ok: true,
      message:
        "Thank you! Online submission is not enabled yet — please also confirm with a committee member.",
    };
  }

  return submitToAppsScript(data);
}

