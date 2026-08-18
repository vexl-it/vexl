# geocoding-db

Everything that owns the **standalone geocoding database** — an in-house
geocoding dataset built from OpenStreetMap: the Postgres schema + migrations,
the query layer used by `location-service`, and the ingest/refresh pipeline.

The database runs on its own Postgres instance (container
`vexl-geocoding-postgres` in dev, database name `geocoding`), fully separated
from the vexl service databases. Exactly two things connect to it:

- **location-service** — serves `/suggest` and `/geocode` from it and applies
  the schema migrations on startup (via `GeocodingDbLayer`),
- **the refresh pipeline** (`scripts/refresh.sh`) — replaces the dataset
  roughly monthly, run **manually from an operator's machine** (not a server
  job) so the heavy download/filter work never consumes server resources.

Both read the connection from `GEOCODING_DB_URL` / `GEOCODING_DB_USER` /
`GEOCODING_DB_PASSWORD` — deliberately not the shared `DB_URL` vars, so the
geocoding DB can never be pointed at a vexl database by accident.

## Data

Three tiers built from OSM, all enriched with the translations the app ships
languages for (`name:xx` tags) and a country code stamped via Natural Earth
boundaries:

- settlements (place=\* nodes: city…city_block) — searchable + reverse
  geocoding,
- POIs (cafés, restaurants, pubs, bars, fast food, parks, gardens,
  attractions, museums) — searchable only,
- streets (named street-like highway ways, deduplicated to one entry per
  street name per ~10 km grid cell; **no house numbers by design**) —
  searchable only.

## Refreshing the dataset

The whole pipeline (`scripts/refresh.sh`: fetch → extract → ingest) ships as
a Docker image, `ghcr.io/vexl-it/geocoding-refresh` — built by the
"[Build] geocoding-refresh docker image" GitHub workflow, also part of the
backend-stack build. It is meant to be run manually (roughly monthly) from an
operator's machine with network access to the geocoding Postgres — never as a
server job. One `docker run` refreshes the whole world: it fetches the raw
Geofabrik extracts (~85 GB), filters them into the three tiers, and ingests
into Postgres with an atomic swap at the end. Kick it off in the evening and
let it run overnight:

```sh
docker run --rm --init \
  --add-host=host.docker.internal:host-gateway \
  --env-file packages/geocoding-db/.env \
  -v vexl-geocoding-refresh:/data \
  ghcr.io/vexl-it/geocoding-refresh:latest
```

- `--env-file` supplies the access keys — same keys as `.env.example`, so the
  package's `.env` works as-is (keep values unquoted). This `.env` belongs to
  the refresh pipeline only — dev seeding never acts on it: the seeder
  refuses non-local databases, so production credentials or the Slack webhook
  stored here can't leak into a dev seed. Note `localhost` inside the
  container is the container itself — to reach a Postgres on your own
  machine, use `host.docker.internal` in `GEOCODING_DB_URL`.
- The `-v …:/data` volume persists raw + filtered files and `refresh.log`
  between runs, so a crashed or interrupted run resumes from the validated
  downloads instead of re-fetching, and stages can be re-run independently —
  e.g. after tweaking the filters, append `extract ingest` to the command to
  skip the ~85 GB download. Regions are selectable the same way with `-r`
  (any Geofabrik path): `-r europe`, `-r europe/slovakia`.
- Give Docker at least 10 GB of memory — the ingest runs Node with an 8 GB
  heap.
- Progress is logged with timestamps to the container's stdout (follow with
  `docker logs -f`) and appended to `refresh.log` in the data volume.

Set `SLACK_ALERT_WEBHOOK_URL` (a Slack incoming-webhook URL, in the same
`.env`) to get a Slack message when the run completes and whenever any step
fails — download, extraction, or ingest (including the sanity-gate abort).
Leave it unset for dev runs.

The ingest loads into staging tables and swaps them in a single transaction —
the service keeps serving the old dataset until the new one is complete, and a
sanity gate refuses to swap in a dataset >30 % smaller than the previous one.
A run against production is therefore safe from a laptop: an interrupted or
failed run leaves the live dataset untouched.

The image is just a packaging of `scripts/refresh.sh`; on a machine with
`curl` + `osmium` installed the script also still runs directly (this is what
backs dev seeding, so it stays continuously tested):

```sh
cp .env.example .env   # then fill in the real GEOCODING_DB_* values
pnpm refresh:geocoding
```

## Local development

`pnpm dev:backend` seeds the geocoding DB automatically: before the services
start it runs `scripts/seedDev.ts`, which creates the `geocoding` database
and schema if missing and — **only when the places table is empty — loads
data**. A non-empty table is never touched, so seeding effectively happens in
exactly two situations: the very first run, and after the user requests a
fresh database with `--fresh-db` (which recreates the volume, leaving the
table empty). Every other run is a fast no-op.

What an empty table gets seeded with:

- **`--seed-places auto`** (the default): a full OSM ingest of Czechia via
  `refresh.sh` when `osmium` is installed (`brew install osmium-tool`),
  topped up with a fixture of major SK/CZ cities + the European capitals so
  search and reverse geocoding work across Europe. Downloads (~800 MB) are
  cached in `~/.cache/vexl/osm`, so re-seeding after `--fresh-db` skips the
  download and only re-runs the ~minutes-long ingest.
- **`--seed-places fixture`** (also the automatic fallback when osmium is
  missing): just the committed fixture — major SK/CZ cities + European
  capitals (`scripts/devSeedData.ts`). Instant, offline, no tools needed.
- **`--seed-places off`**: no data — the database and schema are still
  created if missing (the service crash-loops without them), but nothing is
  seeded.

The seeder can also run standalone (env from `.env`). It is strictly
dev-only: it refuses any `GEOCODING_DB_URL` that doesn't point at a local
host — use `refresh.sh` to load a real dataset.

```sh
pnpm --filter @vexl-next/geocoding-db seed:dev-geocoding
```

A non-empty table is never touched. To switch an existing DB from fixture to
real data, truncate first:

```sh
docker exec vexl-geocoding-postgres psql -U postgres -d geocoding -c 'TRUNCATE places CASCADE'
```

For other regions, pass them to the same pipeline (note the `--` so pnpm
forwards the flags), e.g.:

```sh
pnpm refresh:geocoding -- -r europe/austria
```

## Tests

`pnpm test` — pure unit tests for the ingest parsing and name normalization,
plus shell-level tests of `refresh.sh` with stubbed `curl`/`osmium`/`pnpm`.
The end-to-end ingest test (real subprocess against a throwaway database,
served through the live API) lives in `apps/location-service`.
