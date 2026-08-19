# geocoding-db

Everything that owns the **standalone geocoding database** — an in-house
geocoding dataset built from OpenStreetMap: the Postgres schema + migrations
and the query layer used by `location-service`.

The data itself is built and refreshed by `tools/location-db-updater`, which
lives next to this package. The database runs on its own Postgres instance
(container `vexl-geocoding-postgres` in dev, database name `geocoding`),
fully separated from the vexl service databases. Exactly two things connect to
it:

- **location-service** — serves `/suggest` and `/geocode` from it and applies
  the schema migrations on startup (via `GeocodingDbLayer`),
- **the refresh pipeline** (`tools/location-db-updater/scripts/refresh.sh`) —
  replaces the dataset roughly monthly, run **manually from an operator's
  machine** (not a server job) so the heavy download/filter work never
  consumes server resources.

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

The actual ingest pipeline, dev seeder and Docker image build live in
`tools/location-db-updater` — see its README for how to refresh the dataset,
run dev seeding and build the image.

## Local development

In dev the database is seeded from a committed Czechia dump restored by the
Postgres image when the `geocoding-postgres` volume is first created (see
`tooling/dev/geocoding-postgres-init/`). See the `tools/location-db-updater`
README for the seeder modes (`--seed-places auto|fixture|off`) and
re-seeding.

## Tests

`pnpm test` — pure unit tests for name normalization (`src/common.ts`). All
ingest and refresh-pipeline tests live in `tools/location-db-updater`.
