# Austin Arena Ganeshotsav 2026

A production-ready, mobile-first Ganeshotsav event portal built with Next.js App Router, React 19 and TypeScript.

**Google Sheets is the source of truth for events.** The committee edits a spreadsheet; the site picks up the changes automatically.

The site is a **fully static export deployed to GitHub Pages** — no server, no backend. The sheet is read at build time for the initial HTML, and the browser refetches it on **every page load**, so committee edits appear on the next refresh **without a redeploy**.

| | Command | Result |
| --- | --- | --- |
| **Develop** | `npm run dev` | Local dev server |
| **Build** | `npm run build` | A fully static `out/` folder for GitHub Pages |
| **Deploy** | `npm run deploy` | Publish `out/` to the `gh-pages` branch |

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Google Sheet setup](#google-sheet-setup)
- [Sheet column reference](#sheet-column-reference)
- [Data normalisation and validation](#data-normalisation-and-validation)
- [Working without a sheet](#working-without-a-sheet)
- [Registration submissions](#registration-submissions)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Accessibility, SEO and performance](#accessibility-seo-and-performance)
- [Extending the project](#extending-the-project)

---

## Features

- **Google Sheets as a CMS** — edit the schedule in a spreadsheet, no redeploy needed
- **Live in the browser** — the sheet is refetched on every page load, so edits show up on refresh
- **Fully static** — plain HTML/CSS/JS, hostable on GitHub Pages with no backend
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
                    build time (Node)        every page load (browser)
Google Sheet (CSV) ─→ source.ts ────┐        client-source.ts ──┐
                                     ├─→ service.ts ─────────────┤
events.csv snapshot ─→ (fallback) ──┘   (buildFestivalEventsData)│
                                                                 ↓
                                          useFestivalEvents → pages → components
```

The build-time snapshot renders instantly (fast paint + SEO); `useFestivalEvents`
then refetches the live sheet in the browser and swaps in the fresh data.

| Path | Responsibility |
| --- | --- |
| `src/domain/events/config.ts` | Reads env vars, builds the sheet CSV URL (browser + build) |
| `src/domain/events/csv.ts` | Dependency-free RFC 4180 CSV parser |
| `src/domain/events/mapper.ts` | Column aliasing, normalisation, per-row validation |
| `src/domain/events/source.ts` | Build-time fetch with timeout and fallback |
| `src/domain/events/client-source.ts` | Browser fetch of the live sheet on every load |
| `src/domain/events/useFestivalEvents.ts` | Seeds from the build snapshot, then refreshes live |
| `src/domain/events/service.ts` | `buildFestivalEventsData`: groups today / upcoming / past / featured / calendar |
| `src/domain/events/text.ts` | Underscore removal and title casing |
| `src/domain/events/utils.ts` | Timezone-safe dates, sorting, calendar grouping |
| `src/config/site.ts` | Society name, address, aarti times, navigation |
| `src/components/` | Presentation only |

To move to a CMS, API or database later, replace **`source.ts` and `client-source.ts`**.

### Rendering strategy

Each route is a thin server shell that fetches the build-time seed and hands it
to a client view (`HomeView` / `EventsView`). The view calls `useFestivalEvents`,
which paints the seed immediately, then refetches the live sheet in the browser
and swaps in the fresh data. Crawlers still receive the fully rendered snapshot in
the initial HTML, so SEO is unaffected.

---

## Project structure

```
src/
  app/
    page.tsx              Homepage server shell: fetches the seed, renders HomeView
    events/page.tsx       Events server shell: fetches the seed, renders EventsView
    sitemap.ts            Generated sitemap.xml
    robots.ts             Generated robots.txt
    loading.tsx           Route-level skeletons
    error.tsx             Error boundary
    not-found.tsx         Custom 404
  components/
    Header.tsx            Sticky nav with the mobile drawer
    EventCard.tsx         Single event presentation
    Countdown.tsx         Live countdown to the festival
    common/               SectionHeading, EmptyState, DataNotice, SiteFooter, skeletons
    events/               EventSection, EventCalendar, EventsExplorer, EventsView, forms
    home/                 HomeView, Hero, Aarti, Contribute, Register sections
    seo/                  schema.org JSON-LD
  domain/
    events/               config, csv, mapper, source, client-source, useFestivalEvents, service, text, utils, types
    registration/         schema, client, sink
  config/site.ts          Society name, address, aarti times, navigation
  data/
    events.csv            Committed fallback schedule
    events.sample.csv     Blank template with the expected columns
    events.fallback.json  Generated from events.csv — do not edit by hand

scripts/
  csv-to-json.mjs         Build the fallback snapshot
  validate-events.mjs     Strict CSV validation
  sync-sheet.mjs          Pull the live sheet into events.csv
  build-static.mjs        Static export for GitHub Pages
  verify-static.mjs       Check the export for broken references
  preview-static.mjs      Serve out/ at the real base path
  mock-sheet-server.mjs   Local sheet with deliberately messy data
  google-apps-script/     Registration Web App source
```

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

### Common tasks

| I want to… | Do this |
| --- | --- |
| Change the schedule | Edit the Google Sheet — the live site follows it |
| Change the offline copy of the schedule | Edit `src/data/events.csv`, then `npm run data:build` |
| Pull the sheet into the repo | `npm run data:sync` |
| Change society name, address or aarti times | Edit `src/config/site.ts` |
| Check everything before pushing | `npm run check` |
| See the GitHub Pages build exactly as published | `npm run build:static && npm run preview:static` |

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

Because the browser refetches the sheet on every page load, the URL must be a
**`NEXT_PUBLIC_`** variable so it is available client-side. In `.env.local` (and
later in your GitHub Pages Actions variables):

```bash
NEXT_PUBLIC_GOOGLE_SHEET_ID=1AbC...XyZ
NEXT_PUBLIC_GOOGLE_SHEET_NAME=Events
```

If your tab has a different name, either update `NEXT_PUBLIC_GOOGLE_SHEET_NAME` or use the numeric `gid` from the URL:

```bash
NEXT_PUBLIC_GOOGLE_SHEET_GID=0
```

**5. Verify**

```bash
npm run data:sync
```

This downloads the sheet, validates it, and refreshes the committed snapshot.
(`data:sync` also accepts the non-public `GOOGLE_SHEET_ID` / `GOOGLE_SHEET_CSV_URL`
names, since it only runs locally.)

### Alternative: published CSV link

Instead of a sheet id you can use **File → Share → Publish to web → CSV** and set the full link:

```bash
NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
```

> The published-CSV and `gviz/tq` endpoints send permissive CORS headers, so the
> browser fetch succeeds. A plain `/edit` link is blocked by CORS — always use a
> **Publish to web** link or the sheet id.

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
| `Link` | No | `https://society.site/talent` | Extra action button; opens in a new tab |
| `Link Label` | No | `Read Rules` | Button text for `Link` (defaults to `View Details`) |
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
NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL=http://127.0.0.1:4999/events.csv npm run dev
```

---

## Registration submissions

Registrations are appended to a Google Sheet through a Google Apps Script Web App. The site is a static export, so the browser posts to the Web App directly — `submitRegistrationForm()` in `src/domain/registration/client.ts` validates the payload in the browser first.

### 1. Create the Apps Script Web App

1. In your registrations sheet: **Extensions → Apps Script**
2. Paste the contents of `scripts/google-apps-script/Code.gs`
3. **Project Settings → Script Properties** → add `SHARED_SECRET`
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the generated `/exec` URL

Re-deploy as a **new version** after any script edit, otherwise the old code keeps running.

### 2. Wire it up

The browser posts straight to Apps Script:

```bash
NEXT_PUBLIC_REGISTRATION_ENDPOINT=https://script.google.com/macros/s/XXXX/exec
```

> **`NEXT_PUBLIC_` values are readable in the page source.** Leave `NEXT_PUBLIC_REGISTRATION_SECRET` unset unless you accept that anyone can read it. Instead, harden the Apps Script itself: validate the payload shape, reject entries outside the festival window, and cap submissions per deployment.

The request is sent as `text/plain` so it stays a CORS "simple request" — Apps Script cannot answer a preflight. If the response is unreadable because of a CORS redirect, the client retries in `no-cors` mode so the row is still written.

### If nothing is configured

The form remains fully usable and reports success without persisting, so local development never hits a dead end. A warning is logged to the console.

---

## Environment variables

Every variable is optional — the site builds and runs with none of them set, using the committed CSV snapshot.

Copy `.env.example` to `.env.local` for local work. The **Used by** column shows which deployment target reads each value.

**Site**

| Variable | Used by | Purpose | Default |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Both | Canonical URLs, Open Graph, sitemap | `http://localhost:3000` |

**Events source**

The browser refetches the sheet on every load, so use the `NEXT_PUBLIC_` names
in production. The non-public names are still read at build time (and by
`data:sync`) as a convenience for local work.

| Variable | Exposed to browser | Purpose | Default |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL` | **Yes** | Full published-CSV URL (overrides the id) | — |
| `NEXT_PUBLIC_GOOGLE_SHEET_ID` | **Yes** | Events spreadsheet id | — |
| `NEXT_PUBLIC_GOOGLE_SHEET_NAME` | **Yes** | Tab name to read | `Events` |
| `NEXT_PUBLIC_GOOGLE_SHEET_GID` | **Yes** | Tab gid (takes priority over the name) | — |
| `GOOGLE_SHEET_CSV_URL` / `GOOGLE_SHEET_ID` / … | No | Build-time-only equivalents | — |

**GitHub Pages**

| Variable | Purpose | Default |
| --- | --- | --- |
| `GITHUB_PAGES_BASE_PATH` | Sub-path the site is served from | `/austin-arena-ganeshotsav-2026` |

**Registrations**

| Variable | Exposed to browser | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_REGISTRATION_ENDPOINT` | **Yes** | Apps Script endpoint posted to directly |
| `NEXT_PUBLIC_REGISTRATION_SECRET` | **Yes** | Optional secret — see the warning above |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Export the static site into `out/` (alias of `build:static`) |
| `npm run build:static` | Export a static site into `out/` for GitHub Pages |
| `npm run verify:static` | Check the export for broken or unprefixed references |
| `npm run preview:static` | Serve `out/` locally at the real base path |
| `npm run deploy` | Build, verify and publish to the `gh-pages` branch |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run check` | Validate data + lint + typecheck |
| `npm run data:build` | Rebuild `events.fallback.json` from the CSV |
| `npm run data:validate` | Strict CSV validation |
| `npm run data:sync` | Download the live sheet into the committed CSV |

---

## Deploying to GitHub Pages

GitHub Pages serves static files only:

- **Images are unoptimised.** There is no server to run the Next.js image optimizer.
- **The build snapshots the sheet** for the initial HTML; the browser then refreshes it live on every page load, so schedule edits appear on refresh without a redeploy. A rebuild is only needed for code changes.

### Base path

A project site is served from `https://<owner>.github.io/<repo>/`, so all URLs need that prefix. It defaults to `/austin-arena-ganeshotsav-2026` and can be changed with `GITHUB_PAGES_BASE_PATH`.

For a user site (`<owner>.github.io`) or a custom domain, set it to an empty string:

```bash
GITHUB_PAGES_BASE_PATH= npm run build:static
```

### Option A — automated with GitHub Actions (recommended)

`.github/workflows/deploy-pages.yml` builds and deploys on every push to `main`, on a 6-hourly schedule, and on demand.

1. **Settings → Pages → Source** → select **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables** and add:

   | Variable | Example |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://austin-arena.github.io` |
   | `NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL` | `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv` |
   | `NEXT_PUBLIC_REGISTRATION_ENDPOINT` | `https://script.google.com/macros/s/XXXX/exec` |

   Or use `NEXT_PUBLIC_GOOGLE_SHEET_ID` + `NEXT_PUBLIC_GOOGLE_SHEET_NAME` instead of the CSV URL.
   `GITHUB_PAGES_BASE_PATH` defaults to `/<repo-name>`, so you only need to set it for a user site or custom domain.

3. Push to `main`, or run the workflow manually from the **Actions** tab.

### Option B — manual with the gh-pages CLI

1. **Settings → Pages → Source** → **Deploy from a branch** → branch `gh-pages`, folder `/ (root)`.
2. Put your values in `.env.local`, then:

```bash
npm run deploy
```

That runs the export, verifies it, and pushes `out/` to the `gh-pages` branch. The `--dotfiles` flag is required so `.nojekyll` is published — without it GitHub Pages hides the `_next/` folder and the site loads unstyled.

### Preview locally before deploying

```bash
npm run build:static
npm run preview:static
```

Then open <http://localhost:4173/austin-arena-ganeshotsav-2026/>. This mounts the site at the real base path, so broken asset URLs show up locally instead of in production.

### Keeping the schedule fresh

You rarely need to rebuild for schedule changes: the browser refetches the sheet
on every page load, so a committee edit appears the next time anyone opens or
refreshes the site. A rebuild (push to `main`, or `npm run deploy`) is only needed
when you change **code**. The initial HTML served before the browser fetch
completes still reflects the sheet as of the last build.

### Custom domain

1. Add your domain under **Settings → Pages → Custom domain**.
2. Create `public/CNAME` containing just the domain.
3. Build with an empty base path and matching site URL:

```bash
GITHUB_PAGES_BASE_PATH= NEXT_PUBLIC_SITE_URL=https://your-domain.com npm run deploy
```

### Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Site loads with no CSS | `.nojekyll` missing | Deploy with `--dotfiles` (already in `npm run deploy`) |
| 404 on every page | Wrong base path | Set `GITHUB_PAGES_BASE_PATH` to `/<repo-name>` |
| Images broken, text fine | Base path missing on assets | Run `npm run verify:static` — it lists every bad reference |
| Live edits not showing | Sheet URL not set as `NEXT_PUBLIC_`, or sheet not public | Use a `NEXT_PUBLIC_` sheet var and share the sheet as *Anyone with the link – Viewer* |
| Registration does nothing | `NEXT_PUBLIC_REGISTRATION_ENDPOINT` unset | See [registration submissions](#registration-submissions) |

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

- Thin server shells; interactivity in focused client views
- `next/image` with explicit dimensions and `priority` on the logo
- No layout shift in the countdown (space reserved during hydration)
- `useDeferredValue` keeps search responsive on low-end phones
- Static prerendering with a live in-browser refresh

---

## Extending the project

**Change society details** — edit `src/config/site.ts` (name, address, aarti times, navigation, contribution options).

**Change the data source** — replace `loadEvents()` in `src/domain/events/source.ts` (build time) and `fetchEventsFromSheet()` in `src/domain/events/client-source.ts` (browser). Both only have to return `{ events, meta }`; everything downstream is unchanged.

**Add an event field** — add the column to the sheet, add an alias in `COLUMN_ALIASES`, extend `EventRecord`, and render it in `EventCard`.
