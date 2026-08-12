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
(`packages/geocoding-db/scripts/refresh.sh`).

## Architecture

- **Data + schema + ingest**: `packages/geocoding-db` — see its README for
  the data tiers, the refresh pipeline, and dev seeding.
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

## Deployment

The service requires `GEOCODING_DB_URL` / `GEOCODING_DB_USER` /
`GEOCODING_DB_PASSWORD` at startup — there is no fallback to the old `DB_URL`
vars. Rolling out an image built from this change therefore requires the
dedicated geocoding Postgres and the new env vars to be provisioned first;
without them the service crash-loops at startup.

## Local development

`pnpm dev:backend` starts the dedicated geocoding Postgres container and
seeds it automatically via `packages/geocoding-db` — see that package's
README for seeding modes (`--seed-places auto|fixture|off`) and re-seeding.

## Tests

`pnpm test` — spins up a throwaway database per run (needs the dev Postgres
container running; see `.env.test` for connection settings), runs migrations,
seeds a small fixture dataset, and exercises both endpoints over HTTP.
