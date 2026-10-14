# fitness-hub (performance-tracker)

A **local-first** hub for your training and health data. It pulls workouts, daily metrics, sleep and body
measurements from **Strava**, **Garmin Connect** and the **Google Health API** (Fitbit/Pixel; the successor to the
Fitbit Web API) into a SQLite database on your machine. It then lets **Claude** read that data through an
**MCP server**, so you can ask things like *"What was my weekly cycling volume for the last 8 weeks?"*

- Your data stays local: no telemetry, and nothing is contacted except the three providers.
- Raw provider payloads are kept, and re-syncing is idempotent.
- Claude can only read, apart from `sync_now`. The SQL tool cannot change the database.
- The same ride recorded by Garmin, Strava and Google is counted once.

fitness-hub is split across two repositories:

| Repository | Package | What it contains |
|---|---|---|
| **performance-tracker** (this repo) | `fitness-hub-mcp` | the `fitness-hub` CLI and the MCP server |
| [performance-tracker-backend](https://github.com/iamthanh/performance-tracker-backend) | `fitness-hub-core` | storage, providers, sync, queries; also [PLAN.md](https://github.com/iamthanh/performance-tracker-backend/blob/main/PLAN.md) (the design) and the [data model and provider details](https://github.com/iamthanh/performance-tracker-backend#readme) |

## Install

You need Python 3.11 or newer. Python **3.12 or newer is required for the Garmin provider**, because `garminconnect`
needs it.

```bash
git clone https://github.com/iamthanh/performance-tracker-backend.git
git clone https://github.com/iamthanh/performance-tracker.git
cd performance-tracker
python3.12 -m venv .venv
.venv/bin/pip install -e '../performance-tracker-backend[garmin]' -e '.[dev]'
.venv/bin/pytest            # optional: the whole suite runs offline
.venv/bin/fitness-hub --help
```

Both packages install into the same `fitness_hub` Python package. `fitness-hub-core` is not on PyPI, so install it from
the local clone as shown above. You can also install it from git:
`pip install 'fitness-hub-core[garmin] @ git+https://github.com/iamthanh/performance-tracker-backend.git' -e .`

## Configure

Settings are read from environment variables, then from `~/.fitness-hub/.env` (`$FITNESS_HUB_HOME/.env`), then from
`./.env`. Real environment variables win. Start from [`.env.example`](.env.example):

```bash
mkdir -p ~/.fitness-hub && cp .env.example ~/.fitness-hub/.env && chmod 600 ~/.fitness-hub/.env
```

| Variable | Default | Purpose |
|---|---|---|
| `FITNESS_HUB_HOME` | `~/.fitness-hub` | Database (`fitness.db`), `tokens.json`, `garmin-tokens/` |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | – | Your Strava API application |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | – | Google OAuth client ("Web application") |
| `GARMIN_EMAIL` / `GARMIN_PASSWORD` | – | Optional; skip the prompts of `auth garmin` (the password is never saved by fitness-hub) |
| `OAUTH_PORT` | `8765` | Local OAuth redirect port; must match the registered redirect URI |
| `BACKFILL_DAYS` | `365` | History fetched on the first sync |
| `LOOKBACK_DAYS` | `7` | Overlap re-fetched on every sync, to pick up late edits |

## Connect your services

You only need to authorize the services you use. Sources that are not authorized are skipped.

### Strava

1. Create an API application at <https://www.strava.com/settings/api>. Set **Authorization Callback Domain** to
   `localhost`.
2. Put `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` in your `.env`.
3. Run `fitness-hub auth strava`. A browser opens; approve access and keep the "view private activities" box
   checked. The redirect goes to `http://localhost:8765/callback`, where fitness-hub is listening for up to 5 minutes.
   On a machine with no browser, add `--no-browser` and open the printed URL yourself.
4. Run `fitness-hub sync --source strava --since 2026-09-14` to start with a small window.

Strava allows about 100 requests every 15 minutes. A large backfill can hit that limit. When it does, the sync records
`rate limited`, keeps what it already fetched, and the next sync continues. Strava activity summaries include no
calories.

### Google Health API (Fitbit / Pixel Watch)

> **Access caveat.** Google lists every Google Health API scope as *restricted* and, as of October 2026, says it is
> *not onboarding new projects*. You may not be able to get this working yet. The legacy Fitbit Web API is turned off
> on 2026-10-30 and its tokens do not carry over.

1. Install the **Google Health** app (formerly Fitbit) and sign in with the Google account you will authorize. Let your
   device sync. Data only appears after the phone app syncs.
2. In the Google Cloud console, create a project and **enable the Google Health API**.
3. Configure the **OAuth consent screen**: user type External, status **Testing**, add your own account as a **test
   user**, and add these three scopes:
   - `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly`
   - `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`
   - `https://www.googleapis.com/auth/googlehealth.sleep.readonly`
4. Create an **OAuth client ID** of type **Web application**, with the authorized redirect URI
   `http://localhost:8765/callback`. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your `.env`.
5. Run `fitness-hub auth google`, then `fitness-hub sync --source google_health`.

> **⚠ Refresh tokens expire after 7 days while the consent screen is in "Testing" status.** When that happens, sync
> reports `invalid_grant` and tells you to run `fitness-hub auth google` again. To avoid weekly re-auth, publish the
> OAuth app ("In production"; it can stay unverified for personal use).

If auth says the account is **not linked**, sign in to the Google Health app with that account, sync, and try again.

**Check after your first sync.** The value fields for SpO2, respiratory rate, VO2 max, weight and floors were not in
Google's documentation when this was written. fitness-hub guesses them, logs a warning naming the field it used, and
always stores the raw payload. Run `fitness-hub -v sync --source google_health` once, then compare the values against
the app. For example:

```bash
sqlite3 ~/.fitness-hub/fitness.db "SELECT date, metric, value, raw FROM daily_metrics WHERE source='google_health' AND metric IN ('spo2_pct','respiratory_rate_bpm','vo2_max') ORDER BY date DESC LIMIT 5"
```

### Garmin Connect (unofficial, best-effort)

Garmin's official APIs are only open to approved business partners. fitness-hub uses the community `garminconnect`
library, which logs in the way the website does. **It can break without notice**: Garmin tightened its bot protection
in March 2026, and the library's API changes between versions.

1. Install with the `garmin` extra on Python 3.12 or newer (see Install).
2. Run `fitness-hub auth garmin` and enter your email, password and MFA code if asked. Only session tokens are saved,
   to `~/.fitness-hub/garmin-tokens/`. **Your password is never written to disk.**
3. Start with a short window, `fitness-hub sync --source garmin --since <7 days ago>`, then widen it. The daily stream
   makes several calls per day and pauses 0.4 s between days. If Garmin throttles it, the sync stops at that day and
   resumes there next time.

**If login stops working, use the CSV export.** In Garmin Connect on the web, go to **Activities**, choose
**Export CSV**, then run:

```bash
fitness-hub import-garmin-csv ~/Downloads/Activities.csv --distance-unit km --timezone Europe/Berlin
```

Use `--distance-unit mi` if your account shows miles. With that setting, ascent is treated as feet. `--timezone` is
the zone the times in the CSV are in. Without it the times have no zone, and matching CSV activities against
Strava/Google is unreliable.

## Sync

```bash
fitness-hub sync                                  # all authorized sources, incremental
fitness-hub sync --source strava --source garmin  # some sources only
fitness-hub sync --since 2026-01-01               # reach back at least to this date
fitness-hub sync --full                           # ignore cursors and re-fetch the whole window
fitness-hub status                                # authorization, per-stream cursor/last success/last error, row counts
```

Each stream (Strava activities, Garmin daily, Google sleep, …) syncs and fails independently. Errors appear in
`status` and in the MCP `sync_status` tool. `sync` exits with code 1 if any stream failed. Re-running a sync never
creates duplicates. If you stop a sync partway, the database stays consistent and the next run picks up the gap.

To keep the data fresh, run the daemon:

```bash
fitness-hub run --interval-minutes 60            # sync every hour (survives errors; Ctrl-C to stop)
```

Or schedule `fitness-hub sync` with cron, launchd or systemd. Only one sync runs at a time: a second one exits with
"another sync is already running".

## Use it from Claude

### Claude Code

```bash
claude mcp add fitness-hub -- "$(pwd)/.venv/bin/fitness-hub" serve-mcp
```

### Claude Desktop

Add this to `claude_desktop_config.json`, using absolute paths:

```json
{
  "mcpServers": {
    "fitness-hub": {
      "command": "/absolute/path/to/performance-tracker/.venv/bin/fitness-hub",
      "args": ["serve-mcp"],
      "env": { "FITNESS_HUB_HOME": "/Users/you/.fitness-hub" }
    }
  }
}
```

Then ask, for example:

- *"What was my weekly cycling volume for the last 8 weeks?"*
- *"What's my resting HR trend this month?"*
- *"How did my deep sleep compare on nights after long rides?"*
- *"Sync my data and tell me what changed this week."*

### Tools

| Tool | What it does |
|---|---|
| `sync_status` | Row counts and per-stream cursor, last success and last error |
| `list_activities` | Workouts newest first; filter by dates, sport (`cycling`, `running`, … or a provider type) and source; de-duplicated unless `source` is set |
| `get_activity` | One activity, optionally with the raw provider JSON |
| `activity_summary` | Totals per week (Monday start), month, day or sport: count, distance_km, moving_hours, elevation, calories, average HR. Never double counts |
| `get_daily_metrics` | `{date, metric, source, value}` rows; default last 30 days. Sources are not merged |
| `get_sleep` | Sleep sessions by wake-up date; default last 30 days, main sleep only |
| `get_body_measurements` | Weight (kg) and body fat (%); default last 90 days |
| `query_sql` | One read-only `SELECT`/`WITH` query (at most 1000 rows, 1 MB per value, about 10 s; runs in a worker thread, so other tools stay responsive). Writes, `PRAGMA`, `ATTACH` and multiple statements are rejected |
| `sync_now` | Runs a sync and returns its log. It blocks, and `full=true` can hit rate limits |

Units: metres, seconds, bpm, watts, kcal, kg (summaries use km and hours). Timestamps are UTC, and dates are your local
date. The server's MCP instructions give Claude these details, plus the metric names and table schema.

### HTTP transport (optional)

```bash
fitness-hub serve-mcp --transport http --port 8800     # http://127.0.0.1:8800/mcp
fitness-hub run --http                                 # daemon + HTTP server in one process
claude mcp add --transport http fitness-hub http://127.0.0.1:8800/mcp
```

> **⚠ The HTTP transport has no authentication.** Any process on your machine can read your health data and trigger
> syncs through it. fitness-hub only binds to loopback (`127.0.0.1`, `localhost`, `::1`) and refuses any other host.
> Remote access with authentication is future work.

## Manual verification checklist

The tests never contact the real services. To check against your own accounts:

1. Install, then run `pytest`; it should be green.
2. Strava: `fitness-hub auth strava`, then `fitness-hub sync --source strava --since <30 days ago>`, then `fitness-hub status`.
3. Google: complete the setup above, then `fitness-hub auth google` and `fitness-hub -v sync --source google_health`.
   Check the raw payloads for SpO2, respiratory rate, VO2 max and weight against the app.
4. Garmin: `fitness-hub auth garmin` and a 7-day sync. If login fails, use the CSV export.
5. `claude mcp add fitness-hub -- $(pwd)/.venv/bin/fitness-hub serve-mcp` and ask the questions above.
6. Check that a ride recorded by two services is counted once in `activity_summary`. Its `list_activities` entry
   should show `also_recorded_by`.

## Limitations

- **Google Health access may be gated** (restricted scopes, new projects not being onboarded), and in Testing mode
  **refresh tokens expire after 7 days**.
- **Garmin is unofficial and fragile.** Login may break at any time; the CSV export importer is the fallback.
- **Some Google field names are unverified** (SpO2, respiratory rate, VO2 max, weight, floors). Values are
  best-effort until checked against real payloads, and the raw JSON is always kept.
- **Strava summaries have no calories**, and the rate limit slows deep backfills.
- **Garmin CSV times have no timezone.** Pass `--timezone`, or matching against other sources is unreliable.
- The **HTTP transport has no authentication** and is localhost-only.
- Single user and local only. No web UI, nothing is written back to the providers, and no GPS or FIT streams are stored.

The full list of risks and future work is in the
[backend README](https://github.com/iamthanh/performance-tracker-backend#limitations).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `cannot listen on 127.0.0.1:8765` during auth | Something else is using the port. Free it, or set `OAUTH_PORT` and update the registered redirect URI |
| Strava `redirect_uri invalid` | The app's Authorization Callback Domain must be `localhost` |
| Google `redirect_uri_mismatch` | Register `http://localhost:8765/callback` exactly, on a **Web application** client |
| Google `invalid_grant` | The Testing-mode token expired (7 days): run `fitness-hub auth google` |
| Google 403 on one stream | That scope was not granted. Re-run auth and keep every box checked |
| Garmin `login` error | Run `fitness-hub auth garmin`. If it still fails, use `import-garmin-csv` |
| Nothing new from Google | The device has to sync to the phone app first |
| More detail | Add `-v`: `fitness-hub -v sync` (logs go to stderr) |
