# Geocoding Postgres seed dump

`01-geocoding.sql.zst` is a full plain-SQL `pg_dump` (schema + data + extensions +
indexes) of a local geocoding database. `docker-compose.dev.yaml` mounts this
directory into `docker-entrypoint-initdb.d/` of the `geocoding-postgres`
container, so the Postgres image restores the dump automatically when the
volume is first created (and only then — existing volumes are never touched;
`pnpm dev:backend --fresh-db` recreates the volume).

The dump is database-agnostic: it contains no `CREATE DATABASE` and no
`\connect`, so it restores into whatever database the Postgres image creates
via `POSTGRES_DB`. It does contain `\restrict`/`\unrestrict` guards emitted by
newer `pg_dump` clients, which is harmless (restore verified against
postgres:17).

## Contents

- Tables `places` (~137k rows), `place_names` (~145k rows), and ~22k
  boundaries (`place_boundaries` + `place_boundary_geometries`: administrative
  levels 6–11, cadastral areas and place=\* polygons, simplified to ~10 m and
  subdivided)
- Extensions: `pg_trgm`, `cube`, `earthdistance`, `postgis`
- Coverage: Czechia (`osmium extract -s smart` with the Natural Earth border
  buffered by 3 km from the Geofabrik `europe` extract), with a small
  spillover of places just across the borders (PL, DE, AT, SK)
- Dumped from PostgreSQL 17 with PostGIS 3.6

## Attribution

The data is derived from [OpenStreetMap](https://www.openstreetmap.org),
© OpenStreetMap contributors, and is available under the
[Open Database License (ODbL)](https://www.openstreetmap.org/copyright).

## Regenerating

With a local geocoding database populated (see `tooling/location-db-updater`),
run:

```bash
docker exec vexl-geocoding-postgres pg_dump -U postgres -d geocoding \
  --no-owner --no-acl --format=plain \
  | zstd -19 --threads=0 \
  > tooling/dev/geocoding-postgres-init/01-geocoding.sql.zst
```

Do not use `pg_dumpall` and do not add `--create`; the dump must stay free of
`CREATE DATABASE`/`\connect` statements so it can restore into the
already-created `geocoding` database.
