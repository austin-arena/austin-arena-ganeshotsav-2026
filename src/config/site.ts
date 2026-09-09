/**
 * Central site configuration.
 *
 * Everything that is society-specific lives here so the portal can be reused by
 * another committee by editing a single file.
 */

/**
 * Sub-path the site is served from. Empty on a custom domain or user site;
 * `/<repo>` for GitHub Project Pages. Injected by `next.config.ts`.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const origin = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/**
 * Absolute site URL used for canonical links, Open Graph and the sitemap.
 * The base path is appended automatically when it is not already present.
 */
export const SITE_URL =
  BASE_PATH && !origin.endsWith(BASE_PATH) ? `${origin}${BASE_PATH}` : origin;

/** Prefixes a `public/` asset path so it resolves under the base path. */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SOCIETY = {
  name: "Austin Arena",
  festival: "Ganeshotsav 2026",
  committee: "Austin Arena Cultural Committee",
  address: "Sr. No. 56, Next to Decathlon, Bhumkar Chowk, Tathawade, Pune – 411 033",
  locality: "Tathawade",
  region: "Maharashtra",
  postalCode: "411033",
  country: "IN",
} as const;

export const AARTI_SCHEDULE = [
  { title: "Morning Aarti", time: "09:30 AM", venue: "Ganesh Mandap" },
  { title: "Evening Aarti", time: "08:00 PM", venue: "Ganesh Mandap" },
] as const;

export const CONTRIBUTION_OPTIONS = [
  {
    icon: "volunteer",
    title: "Volunteer",
    description: "Help with event coordination, stage flow and hospitality.",
  },
  {
    icon: "decoration",
    title: "Decoration",
    description: "Support mandap, rangoli and festive lighting preparation.",
  },
  {
    icon: "photography",
    title: "Photography",
    description: "Capture celebration highlights and community memories.",
  },
  {
    icon: "prasad",
    title: "Prasad",
    description: "Help prepare and distribute prasad following hygiene guidelines.",
  },
  {
    icon: "support",
    title: "Event Support",
    description: "Assist with registrations and participant management.",
  },
] as const;

/** Primary navigation, shared by the header and the footer. */
export const NAV_LINKS = [
  { href: "/#aarti", label: "Aarti" },
  { href: "/#today", label: "Today’s Event" },
  { href: "/events", label: "All Events" },
  { href: "/#contribute", label: "Contribute" },
  { href: "/#register", label: "Register" },
] as const;

