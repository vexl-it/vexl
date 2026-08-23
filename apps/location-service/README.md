# location-service

Serves location autocomplete (`GET /suggest`) and reverse geocoding
(`GET /geocode`) for the mobile app — backed by the **standalone geocoding
database** built from OpenStreetMap (see `packages/geocoding-db`). No
third-party geocoding API is involved, so the coordinates users pick for
offers never leave Vexl infrastructure.

The geocoding DB runs on its own Postgres instance, fully separated from the
vexl service databases — geocoding traffic and the monthly OSM refresh never
compete with chats/offers/connections for database resources. The service
connects to it via `GEOCODING_DB_URL` / `GEOCODING_DB_USER` /
`GEOCODING_DB_PASSWORD` and runs the schema migrations from
`@vexl-next/geocoding-db` on startup. The only other component that connects
to that database is the dataset refresh pipeline
(`tooling/location-db-updater/scripts/refresh.sh`).

## Architecture

- **Data + schema**: `packages/geocoding-db` — see its README for the data
  tiers and the query layer.
- **Dataset refresh + dev seeding**: `tooling/location-db-updater` — see its
  README for the refresh pipeline and dev seeding.
- **Search** (`/suggest`): prefix matching on normalized names cascading from
  cheap to expensive — important places first (partial covering index), then
  all names incl. streets/POIs, then typo-tolerant trigram matching (important
  places only). Ranked by match quality and importance (settlement type +
  population; settlements always outrank streets/POIs).
- **Reverse** (`/geocode`): containment first — the most specific boundary
  polygon covering the pin (PostGIS, roles per country resolved at query
  time, see `packages/geocoding-db/README.md`), with the covering city
  boundary or the nearest city/town node as "…, City" context; where no
  sub-city polygon exists, the nearest sub-city node inside the city; and
  only then the nearest **settlement** node (never a street/POI) via cube KNN,
  200 km cutoff. Returns the pin coordinates verbatim and a display address
  like `Holešovice, Praha - CZ` (sub-city place + city + country), matching
  the previous Google-based format.
- Localization is resolved per request `lang`: place names from the stored
  translations, country names via `Intl.DisplayNames` (CLDR, built into Node).

## Deployment

The service requires `GEOCODING_DB_URL` / `GEOCODING_DB_USER` /
`GEOCODING_DB_PASSWORD` at startup — there is no fallback to the old `DB_URL`
vars. Rolling out an image built from this change therefore requires the
dedicated geocoding Postgres and the new env vars to be provisioned first;
the database server must have PostGIS installed. Without them the service
crash-loops at startup.

## Local development

`pnpm dev:backend` starts the dedicated geocoding Postgres container, which
seeds itself from a committed Czechia dump on first volume create (see
`tooling/dev/geocoding-postgres-init/`) — see the `tooling/location-db-updater`
README for seeding modes (`--seed-places auto|fixture|off`) and re-seeding.

## Tests

`TEST_DB_PORT=5433 pnpm test` — spins up a throwaway database per run against
the dev PostGIS container, runs migrations, seeds a small fixture dataset, and
exercises both endpoints over HTTP.
