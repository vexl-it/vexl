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

Four tiers built from OSM, enriched with the translations the app ships
languages for (`name:xx` tags). Every entry gets its country code from
Natural Earth boundaries:

- settlements (place=\* nodes: city…city_block) — searchable + reverse
  geocoding,
- boundaries (administrative relations at levels 6–11, `place=*` polygons,
  Czech cadastral areas; simplified to ~10 m and subdivided) — reverse
  geocoding by containment, worldwide,
- POIs (cafés, restaurants, pubs, bars, fast food, parks, gardens,
  attractions, museums) — searchable only,
- streets (named street-like highway ways, deduplicated to one entry per
  street name per ~10 km grid cell; **no house numbers by design**) —
  searchable only.

The actual ingest pipeline, dev seeder and Docker image build live in
`tools/location-db-updater` — see its README for how to refresh the dataset,
run dev seeding and build the image.

## Reverse geocoding

A pin resolves to a label like `Holešovice, Praha - CZ` — a rough location
for the offer list. Boundaries are matched with `ST_DWithin` at ~20 m
(`BOUNDARY_MATCH_TOLERANCE_DEG`, covering the slivers two independently
simplified neighbours can leave) and each candidate gets a **role** from
`common.ts#boundaryRole`, resolved at query time:

| boundary                                            | role      |
| --------------------------------------------------- | --------- |
| `place=city/town/municipality` tag (any level)      | city      |
| `place=` sub-city tag (suburb, village, hamlet, …)  | sub-city  |
| Czech `boundary=cadastral`                          | sub-city  |
| `admin_level` 8 (default)                           | city      |
| `admin_level` 9–11 (default)                        | sub-city  |
| `admin_level` ≤ 7 (default)                         | ignore    |
| per-country overrides (`COUNTRY_ADMIN_LEVEL_ROLES`) | as listed |

The defaults follow the most common OSM convention (municipality = 8, its
parts below); countries that deviate get a one-line override in
`COUNTRY_ADMIN_LEVEL_ROLES` (Nordic kommuner and Portuguese concelhos at 7,
Austrian Katastralgemeinden at 10 ignored, …) — Nominatim's address levels
are the reference for which ones do.
Ignored levels are still stored, so such a fix never needs a re-ingest.

Resolution, with covering boundaries first and the smallest one winning:

1. the most specific **sub-city** boundary is the label; the covering
   **city** boundary is the "…, City" context when it is a city/town, else
   the most important city/town node within 30 km, same country first (a
   municipality can be a single village — "Černilov, Hradec Králové";
   London boroughs carry no city tag — "Brixton, London");
2. a city boundary with no sub-city boundary inside uses the nearest sub-city
   **node inside that city** within 1.5 km ("Downtown, Cityville" — most of
   the world maps neighbourhoods as nodes only), otherwise the city itself;
3. nothing covers the pin: the nearest settlement node, as before.

The response shape is unchanged: place type, name, translations, country and
optional city context; `apps/location-service` formats the label.

## Local development

In dev the database is seeded from a committed Czechia dump restored by the
PostGIS-capable Postgres image when the `geocoding-postgres` volume is first created (see
`tooling/dev/geocoding-postgres-init/`). See the `tools/location-db-updater`
README for the seeder modes (`--seed-places auto|fixture|off`) and
re-seeding.

## Tests

`TEST_DB_PORT=5433 pnpm test` — unit tests (normalization, boundary roles and
candidate resolution) plus containment integration tests against the dev
PostGIS container. Ingest and refresh-pipeline tests live in
`tools/location-db-updater`.
