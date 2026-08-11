# location-service

Serves location autocomplete (`GET /suggest`) and reverse geocoding
(`GET /geocode`) for the mobile app — backed by an **in-house places database**
built from OpenStreetMap. No third-party geocoding API is involved, so the
coordinates users pick for offers never leave Vexl infrastructure.

## Architecture

- **Data**, three tiers built from OSM, all enriched with the translations the
  app ships languages for (`name:xx` tags) and a country code stamped via
  Natural Earth boundaries:
  - settlements (place=\* nodes: city…city_block) — searchable + reverse
    geocoding,
  - POIs (cafés, restaurants, pubs, bars, fast food, parks, gardens,
    attractions, museums) — searchable only,
  - streets (named street-like highway ways, deduplicated to one entry per
    street name per ~10 km grid cell; **no house numbers by design**) —
    searchable only.
- **Search** (`/suggest`): prefix matching on normalized names cascading from
  cheap to expensive — important places first (partial covering index), then
  all names incl. streets/POIs, then typo-tolerant trigram matching (important
  places only). Ranked by match quality and importance (settlement type +
  population; settlements always outrank streets/POIs).
- **Reverse** (`/geocode`): nearest **settlement** (never a street/POI) via
  cube KNN (`<->`) on a partial gist index, 200 km cutoff. Returns the pin
  coordinates verbatim and a display address like `Vinohrady, Praha - CZ`
  (sub-city place + nearest city + country), matching the previous
  Google-based format.
- Sub-city results get "…, City" context via a nearest-city lateral join.
- Localization is resolved per request `lang`: place names from the stored
  translations, country names via `Intl.DisplayNames` (CLDR, built into Node).

## Refreshing the dataset

`scripts/refresh-places.sh` is the whole pipeline, meant to run weekly (cron)
with no arguments — it fetches raw Geofabrik extracts (needs curl + osmium),
filters them into the three tiers, and ingests into Postgres:

```sh
DB_URL=... DB_USER=... DB_PASSWORD=... ./scripts/refresh-places.sh
```

Raw and filtered files are kept under `data/` (`raw/`, `filtered/`), so stages
can be re-run independently — e.g. after tweaking the filters, re-run just
`refresh-places.sh extract ingest` without re-downloading ~85 GB. Regions are
selectable with `-r` (any Geofabrik path): `-r europe`, `-r europe/slovakia`.

The ingest loads into staging tables and swaps them in a single transaction —
the service keeps serving the old dataset until the new one is complete, and a
sanity gate refuses to swap in a dataset >30 % smaller than the previous one.

## Local development

`pnpm dev:backend` seeds the places DB automatically: before the services
start it runs `scripts/seedDevPlaces.ts`, which creates the `location`
database and schema if missing and — only when the places table is empty —
loads data. Because the Postgres volume persists between runs, this is a
fast no-op on every run except the first one (and after `--fresh-db`).

What an empty table gets seeded with:

- **`--seed-places auto`** (the default): a full OSM ingest of Slovakia +
  Czechia via `refresh-places.sh` when `osmium` is installed
  (`brew install osmium-tool`), topped up with a fixture of the European
  capitals so search and reverse geocoding work across Europe. Downloads
  (~1 GB) are cached in `~/.cache/vexl/osm`, so re-seeding after
  `--fresh-db` skips the download and only re-runs the ~minutes-long ingest.
- **`--seed-places fixture`** (also the automatic fallback when osmium is
  missing): just the committed fixture — major SK/CZ cities + European
  capitals (`scripts/devSeedData.ts`). Instant, offline, no tools needed.
- **`--seed-places off`**: no data — the database and schema are still
  created if missing (the service crash-loops without them), but nothing is
  seeded.

The seeder can also run standalone (env from `.env`):

```sh
pnpm --filter @vexl-next/location-service seed:dev-places
```

A non-empty table is never touched. To switch an existing DB from fixture to
real data, truncate first:

```sh
docker exec vexl-postgres psql -U postgres -d location -c 'TRUNCATE places CASCADE'
```

For other regions, run the pipeline directly, e.g.:

```sh
DB_URL=postgresql://localhost:5432/location DB_USER=postgres DB_PASSWORD=root \
  ./scripts/refresh-places.sh -r europe/austria
```

## Tests

`pnpm test` — spins up a throwaway database per run (needs the dev Postgres
container running; see `.env.test` for connection settings), runs migrations,
seeds a small fixture dataset, and exercises both endpoints over HTTP.
