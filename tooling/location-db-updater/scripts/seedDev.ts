/**
 * Idempotent dev seeder for the geocoding database. `pnpm dev:backend` runs it
 * before starting the services; it can also be run standalone via
 * `pnpm seed:dev-geocoding` (env from .env).
 *
 * The actual dev dataset (a Czechia dump) is restored by the Postgres image
 * itself from tooling/dev/geocoding-postgres-init when the geocoding-postgres
 * volume is FIRST created — this script never downloads or ingests anything.
 * It ensures the database and schema exist (Effect migrations, a no-op on top
 * of the dump), then:
 *
 *   --mode auto (default)  if the places table is empty (volume predates the
 *                          committed dump — the image only restores it on an
 *                          empty volume), prints how to get the dump loaded
 *                          and leaves the table alone.
 *   --mode fixture         if the places table is empty, inserts the committed
 *                          SK/CZ-cities + European-capitals fixture.
 *   --mode off             only ensure the database and schema exist — never
 *                          seeds data (the service would otherwise crash-loop
 *                          on Postgres volumes predating the geocoding DB).
 *
 * A non-empty places table means "already seeded" and the script exits without
 * touching it. To re-seed: `pnpm dev:backend --fresh-db`, or truncate first:
 *   docker exec vexl-geocoding-postgres psql -U postgres -d geocoding \
 *     -c 'TRUNCATE places CASCADE'
 *
 * Env: GEOCODING_DB_URL, GEOCODING_DB_USER, GEOCODING_DB_PASSWORD (same as
 * the service).
 */
import {NodeContext} from '@effect/platform-node'
import {
  computeImportance,
  normalizeName,
} from '@vexl-next/geocoding-db/src/common'
import {GeocodingDbLayer} from '@vexl-next/geocoding-db/src/layer'
import {Effect, Layer} from 'effect'
import pg from 'pg'
import {devSeedPlaces} from './devSeedData'
import {normNameRows} from './ingestParsing'

type SeedMode = 'auto' | 'fixture' | 'off'

const parseArgs = (): {mode: SeedMode} => {
  const args = process.argv.slice(2)
  let mode: SeedMode = 'auto'
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode') {
      const value = args[i + 1]
      i++
      if (value !== 'auto' && value !== 'fixture' && value !== 'off') {
        console.error(`--mode must be auto|fixture|off, got: ${value}`)
        process.exit(1)
      }
      mode = value
    } else {
      console.error(`Unknown argument: ${args[i]}`)
      console.error('Usage: seedDev.ts [--mode auto|fixture|off]')
      process.exit(1)
    }
  }
  return {mode}
}

const connected = async (client: pg.Client): Promise<pg.Client> => {
  await client.connect()
  return client
}

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']

const assertLocalDb = (parsed: URL): void => {
  if (LOCAL_HOSTNAMES.includes(parsed.hostname)) return
  console.error(
    `GEOCODING_DB_URL points at a non-local host ("${parsed.hostname}"). ` +
      'This dev-only seeder refuses non-local databases — use ' +
      'scripts/refresh.sh to load a real dataset.'
  )
  process.exit(1)
}

/**
 * Connects to the geocoding database, creating it first if the Postgres
 * volume predates it (the compose init script only runs on empty volumes).
 */
const connectCreatingDb = async (): Promise<pg.Client> => {
  const dbUrl = process.env.GEOCODING_DB_URL
  if (dbUrl === undefined) {
    console.error('GEOCODING_DB_URL env var is required')
    process.exit(1)
  }
  const parsed = new URL(dbUrl)
  assertLocalDb(parsed)
  const config = {
    host: parsed.hostname,
    port: parsed.port !== '' ? Number(parsed.port) : 5432,
    user: process.env.GEOCODING_DB_USER,
    password: process.env.GEOCODING_DB_PASSWORD,
  }
  const database = parsed.pathname.slice(1)
  try {
    return await connected(new pg.Client({...config, database}))
  } catch (error) {
    const invalidCatalog =
      error instanceof Error && 'code' in error && error.code === '3D000'
    if (!invalidCatalog) throw error
    console.log(`Database "${database}" does not exist yet — creating it`)
    const admin = await connected(
      new pg.Client({...config, database: 'postgres'})
    )
    await admin.query(`CREATE DATABASE "${database}"`)
    await admin.end()
    return await connected(new pg.Client({...config, database}))
  }
}

/**
 * Building GeocodingDbLayer runs the PgMigrator — the schema is applied (and
 * recorded) exactly as on service boot. Reads the same GEOCODING_DB_* env.
 */
const applyMigrations = async (): Promise<void> => {
  await Effect.runPromise(
    Effect.scoped(
      Layer.build(GeocodingDbLayer.pipe(Layer.provide(NodeContext.layer)))
    )
  )
}

/**
 * Inserts the fixture with negative ids (OSM ids are always positive), and
 * skips entries already present as a same-country settlement.
 *
 * Runs in a single transaction so an interrupted seed leaves the table in its
 * pre-fixture state (a partial insert would trip the "already seeded" check on
 * the next run and never be completed).
 */
const insertFixture = async (client: pg.Client): Promise<number> => {
  await client.query('BEGIN')
  try {
    const inserted = await insertFixtureRows(client)
    await client.query('COMMIT')
    return inserted
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

const insertFixtureRows = async (client: pg.Client): Promise<number> => {
  await client.query(`DELETE FROM places WHERE id < 0`)
  let inserted = 0
  for (const [index, place] of devSeedPlaces.entries()) {
    const existing = await client.query(
      `SELECT 1
       FROM place_names pn
       JOIN places p ON p.id = pn.place_id
       WHERE pn.norm_name = $1
         AND p.country_code = $2
         AND p.place_type IN ('city', 'town')
       LIMIT 1`,
      [normalizeName(place.name), place.countryCode]
    )
    if ((existing.rowCount ?? 0) > 0) continue

    const id = -(index + 1)
    const importance = computeImportance(place.placeType, place.population)
    await client.query(
      `INSERT INTO places
         (id, place_type, name, names, country_code, population, importance, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        place.placeType,
        place.name,
        place.names,
        place.countryCode,
        place.population,
        importance,
        place.latitude,
        place.longitude,
      ]
    )
    const nameRows = normNameRows(
      String(id),
      place.name,
      place.names,
      importance
    )
    for (const nameRow of nameRows) {
      await client.query(
        `INSERT INTO place_names (place_id, norm_name, importance)
         VALUES ($1, $2, $3)`,
        [nameRow.place_id, nameRow.norm_name, nameRow.importance]
      )
    }
    inserted++
  }
  return inserted
}

const main = async (): Promise<void> => {
  const {mode} = parseArgs()
  const client = await connectCreatingDb()
  await applyMigrations()

  if (mode === 'off') {
    console.log(
      'Geocoding DB and schema ensured — seeding skipped (--mode off).'
    )
    await client.end()
    return
  }

  const count = Number(
    (
      await client.query<{count: string}>(
        `SELECT count(*) AS count FROM places`
      )
    ).rows[0].count
  )
  if (count > 0) {
    console.log(
      `Geocoding DB already seeded (${count} places) — nothing to do.`
    )
    await client.end()
    return
  }

  if (mode === 'auto') {
    console.warn(
      'Geocoding places table is empty. The committed Czechia dump ' +
        '(tooling/dev/geocoding-postgres-init) is only restored when the ' +
        'geocoding-postgres volume is first created — this volume predates ' +
        'it. Run `pnpm dev:backend --fresh-db` to recreate the volume and ' +
        'get the dump, or `--seed-places fixture` for the small city ' +
        'fixture. Location search returns no results until then.'
    )
    await client.end()
    return
  }

  const inserted = await insertFixture(client)
  console.log(
    `Inserted ${inserted} fixture places (SK/CZ cities + European capitals).`
  )

  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
