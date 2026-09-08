"use client";

/**
 * Tiny pub/sub bridge between event cards and the registration form.
 *
 * It lets the cards stay server components: only the small "Register" button
 * ships JavaScript, instead of the whole page becoming a client tree.
 */

export const SELECT_EVENT = "ganeshotsav:select-event";
const STORAGE_KEY = "ganeshotsav:pending-event";

/** Called by a card. Scrolls to the form, or navigates home when it is absent. */
export function requestRegistration(eventId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const form = document.getElementById("register");

  if (!form) {
    // Different route: hand the selection over via sessionStorage.
    try {
      window.sessionStorage.setItem(STORAGE_KEY, eventId);
    } catch {
      // Private browsing — the user can still pick the event manually.
    }
    return false;
  }

  window.dispatchEvent(new CustomEvent<string>(SELECT_EVENT, { detail: eventId }));
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

/** Reads and clears a selection handed over from another route. */
export function consumePendingRegistration(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    if (value) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
    return value;
  } catch {
    return null;
  }
}

/** Subscribes the form to card clicks. Returns an unsubscribe function. */
export function onRegistrationRequested(handler: (eventId: string) => void): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<string>).detail);
  };

  window.addEventListener(SELECT_EVENT, listener);
  return () => window.removeEventListener(SELECT_EVENT, listener);
}

