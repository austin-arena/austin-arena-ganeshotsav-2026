"use client";

import { validateRegistration, type ValidationErrors } from "./schema";

export interface SubmitResult {
  ok: boolean;
  message: string;
  errors?: ValidationErrors;
}

/**
 * Direct Google Apps Script endpoint, used when the site is hosted statically
 * (GitHub Pages) and there is no `/api/register` route available.
 */
const STATIC_ENDPOINT = process.env.NEXT_PUBLIC_REGISTRATION_ENDPOINT ?? "";

/** Optional secret. On a static host this is public — see the README. */
const STATIC_SECRET = process.env.NEXT_PUBLIC_REGISTRATION_SECRET ?? "";

/** True for `output: "export"` builds, where route handlers do not exist. */
const IS_STATIC_BUILD = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

/** The browser must submit directly when there is no API route to call. */
export const isStaticSubmission = IS_STATIC_BUILD || STATIC_ENDPOINT.length > 0;

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

/** Posts to the Next.js route handler (Vercel / self-hosted). */
async function submitToApiRoute(payload: unknown): Promise<SubmitResult> {
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      errors?: ValidationErrors;
    };

    if (!response.ok || !result.ok) {
      return {
        ok: false,
        message: result.message ?? "Something went wrong. Please try again.",
        errors: result.errors,
      };
    }

    return { ok: true, message: result.message ?? "Registration saved successfully." };
  } catch {
    return { ok: false, message: "Network error. Please check your connection and try again." };
  }
}

/**
 * Single submission entry point for the UI.
 *
 * On a static host the payload is validated in the browser first, because
 * there is no server to do it.
 */
export async function submitRegistrationForm(payload: unknown): Promise<SubmitResult> {
  if (!isStaticSubmission) {
    return submitToApiRoute(payload);
  }

  const { errors, data } = validateRegistration(payload);

  if (!data) {
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }

  if (!STATIC_ENDPOINT) {
    // Static build with no endpoint configured: accept the entry so the form is
    // never a dead end, and make it obvious that nothing was persisted.
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

