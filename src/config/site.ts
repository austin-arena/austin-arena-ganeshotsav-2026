/**
 * Central site configuration.
 *
 * Everything that is society-specific lives here so the portal can be reused by
 * another committee by editing a single file.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

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
  { title: "Morning Aarti", time: "8:00 AM", venue: "Ganesh Mandap" },
  { title: "Evening Maha Aarti", time: "7:30 PM", venue: "Central Lawn" },
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

