# Geocoding Postgres seed dump

`01-geocoding.sql.gz` is a full plain-SQL `pg_dump` (schema + data + extensions +
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

- Tables `places` (~130k rows) and `place_names` (~140k rows)
- Extensions: `pg_trgm`, `cube`, `earthdistance`
- Coverage: Czechia (OSM extract), with a small spillover of places just across
  the borders (PL, DE, AT, SK)
- Dumped from PostgreSQL 13.23

## Attribution

The data is derived from [OpenStreetMap](https://www.openstreetmap.org),
© OpenStreetMap contributors, and is available under the
[Open Database License (ODbL)](https://www.openstreetmap.org/copyright).

## Regenerating

With a local geocoding database populated (see `tools/location-db-updater`),
run:

```bash
pg_dump -h localhost -p 5432 -U postgres -d location \
  --no-owner --no-acl --format=plain \
  | gzip -9 > tooling/dev/geocoding-postgres-init/01-geocoding.sql.gz
```

Do not use `pg_dumpall` and do not add `--create`; the dump must stay free of
`CREATE DATABASE`/`\connect` statements so it can restore into the
already-created `geocoding` database.
