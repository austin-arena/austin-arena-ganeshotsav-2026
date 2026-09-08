# Austin Arena Ganeshotsav 2026

A production-ready, mobile-first Ganeshotsav event portal built with Next.js App Router, React 19 and TypeScript.

**Google Sheets is the source of truth for events.** The committee edits a spreadsheet; the site picks up the changes automatically. There is no database and no backend server to operate — everything is statically generated and deployed to Vercel.

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Google Sheet setup](#google-sheet-setup)
- [Sheet column reference](#sheet-column-reference)
- [Data normalisation and validation](#data-normalisation-and-validation)
- [Working without a sheet](#working-without-a-sheet)
- [Registration submissions](#registration-submissions)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Deploying to Vercel](#deploying-to-vercel)
- [Publishing sheet edits instantly](#publishing-sheet-edits-instantly)
- [Accessibility, SEO and performance](#accessibility-seo-and-performance)
- [Extending the project](#extending-the-project)

---

## Features

- **Google Sheets as a CMS** — edit the schedule in a spreadsheet, no redeploy needed
- **Fully static** — pages are prerendered and refreshed by Incremental Static Regeneration
- **Resilient** — if the sheet is unreachable the site serves the last committed snapshot and shows a notice
- **Sections** — Today's Event, Featured Events, Upcoming Events, Event Calendar, Aarti, Contribute, Register
- **Filtering** — status, category and date-range filters plus full-text search on `/events`
- **Clean data** — `singing_competition` is rendered as `Singing Competition`; dates, times, URLs and phone numbers are all normalised
- **Complete states** — loading skeletons, empty states, error boundaries and a custom 404
- **Accessible** — skip link, landmarks, single `h1` per page, labelled sections and 44px+ touch targets
- **SEO ready** — canonical URLs, Open Graph, Twitter cards, `sitemap.xml`, `robots.txt` and `schema.org` Event data

---

## Architecture

The data layer is fully isolated from the UI. No component imports raw data.

```
Google Sheet (CSV)  ─┐
                     ├─→ source.ts ─→ mapper.ts ─→ service.ts ─→ pages ─→ components
events.csv snapshot ─┘   (fetch +      (normalise    (group by
                          fallback)     + validate)   timing)
```

| Path | Responsibility |
| --- | --- |
| `src/domain/events/config.ts` | Reads env vars, builds the sheet CSV URL |
| `src/domain/events/csv.ts` | Dependency-free RFC 4180 CSV parser |
| `src/domain/events/mapper.ts` | Column aliasing, normalisation, per-row validation |
| `src/domain/events/source.ts` | Fetch with caching, timeout and fallback |
| `src/domain/events/service.ts` | Groups events into today / upcoming / past / featured / calendar |
| `src/domain/events/text.ts` | Underscore removal and title casing |
| `src/domain/events/utils.ts` | Timezone-safe dates, sorting, calendar grouping |
| `src/config/site.ts` | Society name, address, aarti times, navigation |
| `src/components/` | Presentation only |

To move to a CMS, API or database later, replace **`source.ts` only**.

### Rendering strategy

Both pages are server components that are prerendered at build time and revalidated every 5 minutes. Only three small client islands ship JavaScript:

- `Header` — mobile navigation drawer
- `Countdown` — live timer
- `EventsExplorer`, `RegistrationForm`, `RegisterLink` — filtering and form interaction

---

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer

---

## Local setup

```bash
npm install
cp .env.example .env.local
npm run data:build
npm run dev
```

Open <http://localhost:3000>.

Without any environment variables the site runs from `src/data/events.csv`, so you can develop immediately.

---

## Google Sheet setup

**1. Create the sheet**

Create a Google Sheet with a tab named `Events` and add the header row from [the column reference](#sheet-column-reference). You can import `src/data/events.sample.csv` as a starting template:

> File → Import → Upload → `events.sample.csv` → Replace current sheet

**2. Share it publicly (read-only)**

> Share → General access → **Anyone with the link** → **Viewer**

This is required — a private sheet returns an HTML sign-in page instead of CSV.

**3. Copy the spreadsheet id**

From the URL:

```
https://docs.google.com/spreadsheets/d/1AbC...XyZ/edit#gid=0
                                      └──── this part ────┘
```

**4. Configure the app**

In `.env.local` (and later in Vercel):

```bash
GOOGLE_SHEET_ID=1AbC...XyZ
GOOGLE_SHEET_NAME=Events
```

If your tab has a different name, either update `GOOGLE_SHEET_NAME` or use the numeric `gid` from the URL:

```bash
GOOGLE_SHEET_GID=0
```

**5. Verify**

```bash
npm run data:sync
```

This downloads the sheet, validates it, and refreshes the committed snapshot.

### Alternative: published CSV link

Instead of a sheet id you can use **File → Share → Publish to web → CSV** and set the full link:

```bash
GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
```

---

## Sheet column reference

Only `Date`, `Event` and `Venue` are required. Everything else is optional.

| Column | Required | Example | Notes |
| --- | --- | --- | --- |
| `Date` | **Yes** | `2026-09-14` | Also accepts `14/09/2026`, `14 Sep 2026`, `Sep 14, 2026` |
| `Day` | No | `Monday` | Derived from the date when blank |
| `Time` | No | `5:00 PM - 6:30 PM` | Normalised to `5:00 PM – 6:30 PM` |
| `Event` | **Yes** | `Kids Drawing Competition` | Underscores and slugs are cleaned up |
| `Category` | No | `Kids` | Inferred from the event name when blank |
| `Details` | No | `Themed drawing contest.` | Card description |
| `Participants` | No | `Children` | Used as the age group fallback |
| `Age Group` | No | `5-12 years` | Shown as "Open to" |
| `Venue` | **Yes** | `Clubhouse` | Falls back to `To be announced` |
| `Volunteer / Coordinator` | No | `Cultural Team` | A trailing `(9876543210)` is moved to Contact |
| `Contact` | No | `9876543210` | Rendered as a tap-to-call or mailto link |
| `Rules` | No | `Bring your own colours.` | Shown as a "Please note" panel |
| `Registration` | No | `https://forms.gle/abc` | A bare `example.com/x` is upgraded to `https://` |
| `Featured` | No | `Yes` | Accepts `yes`, `y`, `true`, `1`, `x`, `✓` |
| `Status` | No | `Scheduled` | `Cancelled` or `Postponed` show a badge |

Column names are matched case-insensitively and ignore spaces, slashes and underscores, so `volunteer/coordinator` and `Volunteer / Coordinator` both work. Common aliases (`Location` for `Venue`, `Programme` for `Event`, `Description` for `Details`) are also accepted.

---

## Data normalisation and validation

### Automatic cleanup

Everything below happens in `mapper.ts`, for both the sheet and the local snapshot:

| Input | Output |
| --- | --- |
| `singing_competition` | `Singing Competition` |
| `KIDS DRAWING COMPETITION` | `Kids Drawing Competition` |
| `main_stage` | `Main Stage` |
| `15/09/2026` | `2026-09-15` → `Tue, 15 Sep 2026` |
| `5:00 PM-6:30 PM` | `5:00 PM – 6:30 PM` |
| `example.com/register` | `https://example.com/register` |
| `ravi kumar (9876500002)` | Coordinator `Ravi Kumar`, contact `9876500002` |

Sentences written by humans keep their original casing — only all-lowercase or ALL-CAPS values are title cased.

### Runtime behaviour (live sheet)

Bad rows are **skipped and logged**, never fatal. A single malformed row can't take the site down.

- Blank rows are ignored silently
- A row without a name or a readable date is skipped
- Duplicates (same `Date + Time + Event + Venue`) are skipped
- Invalid registration URLs are dropped, the event still renders

### Build-time validation (local CSV)

`npm run data:validate` is strict and **fails the command** on:

- Missing or unreadable `Date`
- Missing `Event`
- Invalid `Registration` URL
- Duplicate rows

Example output:

```
Error: Event CSV validation failed:
- Row 2: Date is missing or invalid.
- Row 2: Event is required.
- Row 3: Registration must be a valid URL.
- Row 4: Duplicate event for the same Date + Time + Event + Venue.
```

Warnings (empty venue, unrecognised columns) are printed but do not fail.

---

## Working without a sheet

`src/data/events.csv` is the committed fallback. It is used when:

- no sheet is configured, or
- the sheet is unreachable, private, or returns no usable rows

In the fallback case the site still renders fully and displays a small notice:

> Live schedule could not be loaded. Showing the last published version.

To update the fallback:

```bash
# edit src/data/events.csv, then
npm run data:validate
npm run data:build
```

Commit both `src/data/events.csv` and `src/data/events.fallback.json`.

### Testing with a mock sheet

A local mock endpoint with deliberately messy data is included:

```bash
node scripts/mock-sheet-server.mjs &
GOOGLE_SHEET_CSV_URL=http://127.0.0.1:4999/events.csv npm run build
GOOGLE_SHEET_CSV_URL=http://127.0.0.1:4999/events.csv npm start
```

---

## Registration submissions

The registration form posts to `/api/register`, which validates server-side and forwards to a Google Apps Script Web App that appends a row to a sheet.

**Setup**

1. In your registrations sheet: **Extensions → Apps Script**
2. Paste `scripts/google-apps-script/Code.gs`
3. **Project Settings → Script Properties** → add `SHARED_SECRET`
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the `/exec` URL into your environment:

```bash
GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/XXXX/exec
GOOGLE_SHEETS_SHARED_SECRET=a-long-random-string
```

If these are unset the form still works end-to-end — it simply does not persist, which keeps local development and preview deployments usable.

**Protections:** server-side validation, a hidden honeypot field, a 5 requests/minute/IP throttle and a 10-second outbound timeout.

> The in-memory rate limiter resets per serverless instance. For high traffic, swap it for Upstash Redis.

---

## Environment variables

All are optional — the site builds and runs with none of them set.

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, Open Graph, sitemap | `http://localhost:3000` |
| `GOOGLE_SHEET_ID` | Events spreadsheet id | — |
| `GOOGLE_SHEET_NAME` | Tab name to read | `Events` |
| `GOOGLE_SHEET_GID` | Tab gid (takes priority over the name) | — |
| `GOOGLE_SHEET_CSV_URL` | Full published-CSV URL (overrides the id) | — |
| `EVENTS_REVALIDATE_SECONDS` | Sheet refetch window | `300` |
| `REVALIDATE_SECRET` | Secret for `POST /api/revalidate` | — |
| `GOOGLE_SHEETS_WEBAPP_URL` | Apps Script endpoint for registrations | — |
| `GOOGLE_SHEETS_SHARED_SECRET` | Secret checked by the Apps Script | — |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Regenerate fallback data, then build for production |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run check` | Validate data + lint + typecheck |
| `npm run data:build` | Rebuild `events.fallback.json` from the CSV |
| `npm run data:validate` | Strict CSV validation |
| `npm run data:sync` | Download the live sheet into the committed CSV |

---

## Deploying to Vercel

1. Push the repository to GitHub, GitLab or Bitbucket.
2. **Import Project** in Vercel and keep the detected Next.js defaults.
3. Add environment variables under **Settings → Environment Variables**:

   ```
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   GOOGLE_SHEET_ID=1AbC...XyZ
   GOOGLE_SHEET_NAME=Events
   REVALIDATE_SECRET=<random string>
   ```

4. Deploy.

Notes:

- The build runs `data:build` first, so the fallback snapshot is always in sync.
- `/` and `/events` are static with 5-minute ISR; `/api/*` runs on demand.
- Assets are served from `public/`; SVGs are optimised through `next/image` with a locked-down CSP.
- If `NEXT_PUBLIC_SITE_URL` is unset, Vercel's production URL is used automatically.

---

## Publishing sheet edits instantly

By default a sheet edit appears within 5 minutes. To publish immediately:

```bash
curl -X POST "https://your-domain.com/api/revalidate?secret=$REVALIDATE_SECRET"
```

Response:

```json
{ "ok": true, "revalidated": "events", "at": "2026-09-08T05:42:35.808Z" }
```

You can wire this to a Google Sheets `onEdit` trigger so the site refreshes as the committee types.

---

## Accessibility, SEO and performance

**Accessibility**

- Skip-to-content link, `header` / `main` / `footer` landmarks
- One `h1` per page; every section labelled via `aria-labelledby`
- Screen-reader prefixes on card metadata ("Date:", "Venue:", "Coordinator:")
- `aria-invalid` and `aria-describedby` wired to form errors
- Minimum 44×44px touch targets; visible `:focus-visible` rings
- Mobile menu closes on Escape, route change and scrim tap
- `prefers-reduced-motion` respected

**SEO**

- `sitemap.xml` and `robots.txt` generated from `src/app/`
- Canonical URLs, Open Graph, Twitter cards, `theme-color`
- `schema.org` `ItemList` of `Event` objects on both pages, including `EventCancelled` / `EventPostponed` states

**Performance**

- Server components by default; three small client islands
- `next/image` with AVIF/WebP, explicit dimensions and `priority` on the logo
- No layout shift in the countdown (space reserved during hydration)
- `useDeferredValue` keeps search responsive on low-end phones
- Static prerendering with background revalidation

---

## Extending the project

**Change society details** — edit `src/config/site.ts` (name, address, aarti times, navigation, contribution options).

**Change the data source** — replace `loadEvents()` in `src/domain/events/source.ts`. It only has to return `{ events, meta }`; everything downstream is unchanged.

**Add an event field** — add the column to the sheet, add an alias in `COLUMN_ALIASES`, extend `EventRecord`, and render it in `EventCard`.
