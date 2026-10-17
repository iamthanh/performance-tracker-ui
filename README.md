# performance-tracker-ui

A TrainingPeaks-style analysis UI for your own training data. It reads everything from the local
[fitness-hub](https://github.com/iamthanh/performance-tracker-backend) read API (`fitness-hub serve-api`), which
holds your Strava history (with per-second power, heart rate and GPS), Garmin health data and the computed
training metrics. Nothing leaves your machine.

| Page | What it shows |
|---|---|
| **Fitness** | Performance index (how good you are, from best efforts: a score and six components with when each was last tested, what raised it, aerobic efficiency); fitness (CTL), fatigue (ATL) and form (TSB) with daily TSS, like the Performance Management Chart; weekly TSS; ramp rate; calories eaten vs burned |
| **Calendar** | Month view of workouts (duration, TSS, IF, distance, kcal burned) with weekly totals (hours, distance, TSS, kJ, kcal); kcal in and out per day |
| **Activities** | Every workout, sortable and searchable, with TSS, IF, NP, average HR, calories burned and decoupling; **Import workout** uploads .fit/.gpx/.tcx files (drag and drop, several at once) and analyses them |
| **Workout** | Power, heart rate, cadence, speed and elevation over time with a synced crosshair and readout; NP, IF, TSS, VI, EF, Pw:HR decoupling, work; time in power and HR zones; peak power vs your 90-day best; W/kg and kJ/kg; durability (best 1/5/8/10/15/20 min after 10, 20 ... kJ/kg of work vs fresh); W′ balance chart with matches burned; efforts above FTP found automatically; route; fueling (carbs, fluid and sodium per hour, caffeine, vs energy and estimated carbs burned); laps |
| **Power curve** | Mean-maximal power from 1 s to 5 h, comparing two date ranges, with the ride that set each best |
| **Health** | Resting HR, HRV, sleep stages and weight from Garmin next to form; all-day heart rate for any day |
| **Nutrition** | A day's food and drink by meal against calories burned (your watch's total), with carbs, protein and fat; saved foods for one-tap logging |
| **Settings** | FTP, threshold HR, max HR and resting HR in effect; set your own from a date on (re-scores workouts); FTP history; performance index weights (presets by rider type) and easing |

## Run it

You need Node 22 (`nvm use` reads `.nvmrc`) and the backend set up with your data imported.

```bash
# terminal 1: the API (in performance-tracker-backend)
.venv/bin/fitness-hub serve-api            # http://127.0.0.1:8801

# terminal 2: the UI
npm install
npm run dev                                # http://127.0.0.1:5173
```

The dev server proxies `/api` to `http://127.0.0.1:8801` (set `FITNESS_HUB_API` to change it), so the browser talks
to a single origin. For a production build, `npm run build` then `npm run preview` serves `dist/` with the same proxy.

### From other devices on your network

Both services listen on this machine only by default. To use the UI from a phone or another computer on the same
network, start both in LAN mode:

```bash
# terminal 1 (performance-tracker-backend)
.venv/bin/fitness-hub serve-api --host 0.0.0.0   # or put API_HOST=0.0.0.0 in ~/.fitness-hub/.env

# terminal 2: dev server, or a production build (faster on phones)
npm run dev:lan                                   # http://<this machine's IP>:5173
npm run build && npm run preview:lan              # http://<this machine's IP>:4173
```

Then open `http://<IP>:5173` on the other device; Vite prints the address under "Network". `http://<hostname>.local:5173`
works too where mDNS does (avahi on this machine, and a client that resolves `.local`; some older Android versions
do not). The API must be in LAN mode as well, because the proxy passes the browser's address on and the API refuses
names it does not know. Other devices need only the UI port; the API on 8801 is reachable too, for scripts.

- **There is no login.** Anyone on the network can see your training and health data and change your thresholds.
  Use it on a home network you trust, not on public Wi-Fi.
- Both servers answer only devices with a loopback, private (10/8, 172.16/12, 192.168/16, fc00::/7) or link-local
  address, even if this machine also has a public IPv4 or IPv6 address.
- If a firewall is on (Ubuntu: `sudo ufw status`), open the ports to your network only, for example
  `sudo ufw allow from 192.168.1.0/24 to any port 5173,4173,8801 proto tcp`.
- IP addresses, `localhost` and this machine's host name (bare and `.local`) work. For another name, such as a DNS
  entry on your router, list it in both services, comma-separated:
  `UI_ALLOWED_HOSTS=nas.home npm run dev:lan`, and `API_ALLOWED_HOSTS=nas.home` in the backend's `.env`.

## Development

```bash
npm run typecheck    # tsc
npm test             # vitest: pure logic (lib/ folders) and page rendering with a mocked API
npm run build        # typecheck + production build
```

Run `npm run build && npm test` before pushing; CI for this repo is not set up yet.

- **Stack:** React 18, TypeScript, Vite, React Router, TanStack Query (requests, caching, keeping the last render
  while a filter change loads) and Recharts.
- **Threshold rules:** `src/lib/training.ts` mirrors the backend's rule for which FTP or threshold HR is in effect on
  a date (`analysis.Timeline`), and its tests use the same cases as the backend's.

### Project structure

```
src/
  main.tsx            entry: global styles, providers, <App/>
  app/                the shell: App (top bar + current page), routes.tsx, nav.ts, layout/, queryClient
  features/<page>/    one folder per page: fitness, calendar, activities (the list), activity-detail (one
                      workout), power-curve, health, nutrition, settings
    <Name>Page.tsx    lays out the page from its components; holds only state shared between them
    components/       pieces of this page
    hooks/            the page's data (wrapping api/ queries) and form or view state
    lib/              the page's pure logic and types, with tests beside them
    index.ts          exports the page, nothing else
  components/         generic building blocks (no knowledge of any page), imported from "@/components"
    charts/           ChartCard, TooltipBox + tooltipContent, DailyLineChart, Legend, shared axis/grid props
    controls/         Segmented, RangePresetPicker, Field
    data/             StatTile, DataTable, Badge
    feedback/         Loading / ErrorState / Empty, their *Card versions, ErrorBoundary, Spinner, ProgressBar
    layout/           PageHeader, Card + CardHeader, Modal
    nutrition/        EntryForm (log food or drink, or a workout's fueling), NutrientFields
  hooks/              generic hooks: useColors (chart colours), useRangePreset, useThemeChoice
  api/                http.ts (fetch + errors), endpoints.ts (one function per endpoint), queries.ts (TanStack
                      Query hooks and query keys), types.ts (response shapes)
  lib/                generic pure helpers: dates, format, training (threshold rules), nutrition, paths, theme
  styles/             global CSS in cascade order (index.css imports the rest); page CSS lives with its page
  test/               test setup and helpers (mockApi, renderAt)
```

Conventions:

- **Imports** use `@/` for `src/` (`import { ChartCard } from "@/components"`), and relative paths within a feature.
  Features never import from each other.
- **Data** is read only through the hooks in `api/queries.ts` (the `@/api` barrel does not export the raw
  endpoints). Query keys are defined once, in `queryKeys`.
- **Where code goes:** something that knows about one page lives in that page's folder. Something generic (a line
  chart of daily values, a date formatter) goes in the shared `components/`, `hooks/` or `lib/`, even if one page
  uses it so far; it must not know about any page.
- **Logic is pure and tested:** sorting, grouping, series, zones and projections are plain functions in `lib/`
  folders with `*.test.ts` files beside them. `app/App.test.tsx` covers pages end to end with a mocked API.
- **Charts** take their colours from `useColors()` (theme tokens, never literal colours) and their frame from
  `axisProps`, `gridProps`, `CHART_MARGIN` and `lineCursor`/`barCursor`. Every data chart sits in a `ChartCard` with
  a `table` twin.
- **Files are named after the component they export** (small families share one: `Card` + `CardHeader`, the state
  cards); a file that exports components exports nothing else (for fast refresh), so helpers live in `.ts` files.

To add a page: create `features/<name>/` with `<Name>Page.tsx` and an `index.ts` exporting it, add its route in
`app/routes.tsx` and its nav entry in `app/nav.ts`, and add its endpoint (if new) to `api/endpoints.ts`,
`api/queries.ts` and `api/types.ts`.

### Charts

The charts follow a few fixed rules so they stay honest and readable:

- **One y-axis per chart.** Measures with different units (power, heart rate, cadence) get stacked charts on a
  shared time axis with a synced crosshair, never a second y-axis. Fitness, fatigue and daily TSS share one chart
  because they are all TSS per day; form gets its own chart below.
- **Colour has a job.**
  - Series colours come from a palette whose first slots were validated for colour-vision deficiency in light and
    dark mode.
  - Form uses a diverging blue/red split at zero.
  - Single-series charts (zones, weekly TSS) use one colour, with labels carrying identity.
  - Text never wears a series colour.
- **Data charts have a Table view** with the same numbers (the FTP history's values are in the table below it).
- **Light and dark themes** are designed separately (not inverted). They follow the OS by default; the header
  button cycles Auto / Light / Dark.
