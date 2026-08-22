# location-db-updater

Standalone **geocoding dataset updater** for the geocoding database that lives
in `packages/geocoding-db`. It owns the OpenStreetMap ingest/refresh pipeline,
the dev seeder, and the Docker image build for `ghcr.io/vexl-it/geocoding-refresh`.

The database itself — schema, migrations and the query layer used by
`location-service` — is in `packages/geocoding-db`. This package only builds and
updates the data inside it.

## Data

Four tiers built from OSM, enriched with the translations the app ships
languages for (`name:xx` tags). Every entry gets its country code from
Natural Earth boundaries (boundaries by their centroid):

- settlements (place=\* nodes: city…city_block) — searchable + reverse
  geocoding,
- boundaries — reverse geocoding by containment, worldwide:
  `boundary=administrative` relations at admin levels 6–11 (plus any level
  when the relation carries a settlement `place=*` tag — Berlin, Wien, Praha),
  settlement polygons tagged `place=*` (ways and relations), and Czech
  `boundary=cadastral` areas (katastrální území — what gives "Holešovice");
  cadastral areas elsewhere are dropped,
- POIs (cafés, restaurants, pubs, bars, fast food, parks, gardens,
  attractions, museums) — searchable only,
- streets (named street-like highway ways, deduplicated to one entry per
  street name per ~10 km grid cell; **no house numbers by design**) —
  searchable only.

Boundary metadata (`name`, translations, `country_code`, `boundary_type`,
`admin_level`, `place_tag`) is stored once per boundary; a GiST-indexed
geometry table holds its polygon parts. Geometry is run through
`ST_MakeValid`, simplified with `ST_SimplifyPreserveTopology` to ~10 m
(`BOUNDARY_SIMPLIFY_TOLERANCE_DEG` in `packages/geocoding-db/src/common.ts` —
the label is a rough location, and a pin 10 m from a border is ambiguous
anyway) and split with `ST_Subdivide` into parts of at most 256 vertices, so
point-in-polygon stays cheap on huge boundaries. Measured on Czechia this is
~3× smaller than exact geometry. Whether a boundary acts as the city or the
sub-city part of a label is **not** decided at ingest — the query layer maps
`(country_code, admin_level, place_tag)` to a role, so fixing a country's level
semantics never needs a re-ingest (see `packages/geocoding-db/README.md`).
The target Postgres must have PostGIS available.

## Refreshing the dataset

The whole pipeline (`scripts/refresh.sh`: fetch → extract → ingest) ships as a
Docker image, `ghcr.io/vexl-it/geocoding-refresh` — built by the
"[Build] geocoding-refresh docker image" GitHub workflow, also part of the
backend-stack build. It is meant to be run manually (roughly monthly) from an
operator's machine with network access to the geocoding Postgres — never as a
server job. One `docker run` refreshes the whole world: it fetches the raw
Geofabrik extracts (~85 GB), filters them into the four tiers, and ingests
into Postgres with an atomic swap at the end. Kick it off in the evening and
let it run overnight:

```sh
docker run --rm --init \
  --add-host=host.docker.internal:host-gateway \
  --env-file tools/location-db-updater/.env \
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
  `docker logs -f`) and appended to `refresh.log` in the data volume. While a
  file is downloading, curl also displays its live transfer meter with the
  percentage and bytes downloaded, total size, estimated time remaining, and
  average/current speed.

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
`curl` + `osmium` installed the script also still runs directly:

```sh
cp .env.example .env   # then fill in the real GEOCODING_DB_* values
pnpm refresh:geocoding
```

For other regions, pass them to the same pipeline (note the `--` so pnpm
forwards the flags), e.g.:

```sh
pnpm refresh:geocoding -- -r europe/austria
```

## Local development

The dev dataset is a committed Czechia dump
(`tooling/dev/geocoding-postgres-init/`) that the Postgres image restores
automatically when the `geocoding-postgres` volume is first created —
`docker-compose.dev.yaml` mounts the directory into
`docker-entrypoint-initdb.d`. No downloads, no `osmium`, works offline.
`pnpm dev:backend --fresh-db` recreates the volume and re-restores the dump.

Before the services start, `pnpm dev:backend` additionally runs
`scripts/seedDev.ts`, which creates the `geocoding` database and schema if
missing (the image init only runs on empty volumes, so old volumes need this
— the service crash-loops without the database). It never downloads or
ingests anything; what it does with an **empty** places table depends on the
mode:

- **`--seed-places auto`** (the default): nothing — an empty table means the
  volume predates the committed dump, so it prints a pointer to `--fresh-db`
  and leaves the table alone.
- **`--seed-places fixture`**: inserts the committed fixture — major SK/CZ
  cities + European capitals (`scripts/devSeedData.ts`).
- **`--seed-places off`**: nothing, ever — database and schema only.

A non-empty table is never touched. The seeder can also run standalone (env
from `.env`); it is strictly dev-only and refuses any `GEOCODING_DB_URL` that
doesn't point at a local host — use `refresh.sh` to load a real dataset:

```sh
pnpm --filter @vexl-next/location-db-updater seed:dev-geocoding
```

## Tests

`pnpm test` — pure unit tests for ingest parsing, shell-level tests of
`refresh.sh` with stubbed `curl`/`osmium`/`pnpm`, and an end-to-end ingest test
that runs the real script against a throwaway database. The end-to-end test
needs the dev PostGIS container running (`TEST_DB_PORT=5433 pnpm test`).

## Building the Docker image

The GitHub Actions workflow `.github/workflows/build-geocoding-refresh.yaml`
builds and pushes the image. To build locally from the repo root:

```sh
docker build -f tools/location-db-updater/Dockerfile .
```
