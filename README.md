# performance-tracker-ui

A TrainingPeaks-style analysis UI for your own training data. It reads everything from the local
[fitness-hub](https://github.com/iamthanh/performance-tracker-backend) read API (`fitness-hub serve-api`), which
holds your Strava history (with per-second power, heart rate and GPS), Garmin health data and the computed
training metrics. Nothing leaves your machine.

| Page | What it shows |
|---|---|
| **Fitness** | Fitness (CTL), fatigue (ATL) and form (TSB) with daily TSS, like the Performance Management Chart; weekly TSS; ramp rate |
| **Calendar** | Month view of workouts (duration, TSS, IF, distance) with weekly totals (hours, distance, TSS, kJ) |
| **Activities** | Every workout, sortable and searchable, with TSS, IF, NP, average HR and decoupling |
| **Workout** | Power, heart rate, cadence, speed and elevation over time with a synced crosshair and readout; NP, IF, TSS, VI, EF, Pw:HR decoupling, work; time in power and HR zones; peak power vs your 90-day best; route; laps |
| **Power curve** | Mean-maximal power from 1 s to 5 h, comparing two date ranges, with the ride that set each best |
| **Health** | Resting HR, HRV, sleep stages and weight from Garmin next to form; all-day heart rate for any day |
| **Settings** | FTP, threshold HR, max HR and resting HR in effect; set your own from a date on (re-scores workouts); FTP history |

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

## Development

```bash
npm run typecheck    # tsc
npm test             # vitest: formatting, dates, threshold rules, page rendering with a mocked API
npm run build        # typecheck + production build
```

Run `npm run build && npm test` before pushing; CI for this repo is not set up yet.

- **Stack:** React 18, TypeScript, Vite, React Router, TanStack Query (requests, caching, keeping the last render
  while a filter change loads) and Recharts.
- **Layout:** `src/api` (types, client, query hooks), `src/lib` (dates, formatting, training rules, theme),
  `src/components`, `src/pages`.
- **Threshold rules:** `src/lib/training.ts` mirrors the backend's rule for which FTP or threshold HR is in effect on
  a date (`analysis.Timeline`), and its tests use the same cases as the backend's.

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
