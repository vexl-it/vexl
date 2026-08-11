/* eslint-disable no-console */
/**
 * Idempotent dev seeder for the places database. `pnpm dev:backend` runs it
 * before starting the services; it can also be run standalone via
 * `pnpm seed:dev-places` (env from .env).
 *
 * Ensures the database and schema exist, then — only when the places table is
 * EMPTY — seeds it:
 *
 *   --mode auto (default)  full OSM ingest of Slovakia + Czechia via
 *                          refresh-places.sh when osmium is installed
 *                          (downloads cached under ~/.cache/vexl/osm, so
 *                          re-seeding after --fresh-db doesn't re-download),
 *                          then tops up with the European-capitals fixture.
 *                          Without osmium: fixture only.
 *   --mode fixture         fixture only (no external tools, no downloads).
 *   --mode off             only ensure the database and schema exist — never
 *                          seeds data (the service would otherwise crash-loop
 *                          on Postgres volumes predating the location DB).
 *
 * A non-empty places table means "already seeded" and the script exits without
 * touching it. To re-seed: `pnpm dev:backend --fresh-db`, or truncate first:
 *   docker exec vexl-postgres psql -U postgres -d location \
 *     -c 'TRUNCATE places CASCADE'
 *
 * Env: DB_URL, DB_USER, DB_PASSWORD (same as the service).
 */
import {NodeContext} from '@effect/platform-node'
import {Effect, Layer} from 'effect'
import {spawnSync} from 'node:child_process'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import pg from 'pg'
import DbLayer from '../src/db/layer'
import {computeImportance, normalizeName} from '../src/places/common'
import {devSeedPlaces} from './devSeedData'

const INGEST_REGIONS = ['europe/slovakia', 'europe/czech-republic']
/** Dev doesn't need fresh map data — reuse cached downloads for two weeks. */
const CACHE_FRESH_MINUTES = 14 * 24 * 60

const defaultDataDir = join(
  process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'),
  'vexl',
  'osm'
)

type SeedMode = 'auto' | 'fixture' | 'off'

const parseArgs = (): {mode: SeedMode; dataDir: string} => {
  const args = process.argv.slice(2)
  let mode: SeedMode = 'auto'
  let dataDir = defaultDataDir
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode') {
      const value = args[i + 1]
      i++
      if (value !== 'auto' && value !== 'fixture' && value !== 'off') {
        console.error(`--mode must be auto|fixture|off, got: ${value}`)
        process.exit(1)
      }
      mode = value
    } else if (args[i] === '--data-dir') {
      const value = args[i + 1]
      i++
      if (value === undefined) {
        console.error('--data-dir needs a value')
        process.exit(1)
      }
      dataDir = value
    } else {
      console.error(`Unknown argument: ${args[i]}`)
      console.error(
        'Usage: seedDevPlaces.ts [--mode auto|fixture|off] [--data-dir <dir>]'
      )
      process.exit(1)
    }
  }
  return {mode, dataDir}
}

const connected = async (client: pg.Client): Promise<pg.Client> => {
  await client.connect()
  return client
}

/**
 * Connects to the location database, creating it first if the Postgres volume
 * predates it (the compose init script only runs on empty volumes).
 */
const connectCreatingDb = async (): Promise<pg.Client> => {
  const dbUrl = process.env.DB_URL
  if (dbUrl === undefined) {
    console.error('DB_URL env var is required')
    process.exit(1)
  }
  const parsed = new URL(dbUrl)
  const config = {
    host: parsed.hostname,
    port: parsed.port !== '' ? Number(parsed.port) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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
 * Building the service's DbLayer runs the PgMigrator — the schema is applied
 * (and recorded) exactly as on service boot. Reads the same DB_* env.
 */
const applyMigrations = async (): Promise<void> => {
  await Effect.runPromise(
    Effect.scoped(Layer.build(DbLayer.pipe(Layer.provide(NodeContext.layer))))
  )
}

const osmiumAvailable = (): boolean =>
  spawnSync('osmium', ['--version'], {stdio: 'ignore'}).status === 0

const runOsmIngest = (dataDir: string): boolean => {
  const script = fileURLToPath(new URL('refresh-places.sh', import.meta.url))
  const regionArgs = INGEST_REGIONS.flatMap((region) => ['-r', region])
  const result = spawnSync(script, ['-d', dataDir, ...regionArgs], {
    stdio: 'inherit',
    env: {...process.env, FRESH_MINUTES: String(CACHE_FRESH_MINUTES)},
  })
  return result.status === 0
}

/**
 * Inserts the fixture with negative ids (OSM ids are always positive), and
 * skips entries already present as a same-country settlement — so after a real
 * OSM ingest only the capitals outside SK/CZ are added on top.
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
    const normNames = [
      ...new Set(
        [place.name, ...Object.values(place.names)]
          .map(normalizeName)
          .filter((one) => one.length > 0)
      ),
    ]
    for (const normName of normNames) {
      await client.query(
        `INSERT INTO place_names (place_id, norm_name, importance)
         VALUES ($1, $2, $3)`,
        [id, normName, importance]
      )
    }
    inserted++
  }
  return inserted
}

const main = async (): Promise<void> => {
  const {mode, dataDir} = parseArgs()
  const client = await connectCreatingDb()
  await applyMigrations()

  if (mode === 'off') {
    console.log('Places DB and schema ensured — seeding skipped (--mode off).')
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
    console.log(`Places DB already seeded (${count} places) — nothing to do.`)
    await client.end()
    return
  }

  if (mode === 'auto') {
    if (osmiumAvailable()) {
      console.log(
        `Places DB is empty — ingesting OSM data for ${INGEST_REGIONS.join(', ')} (cache: ${dataDir}).`
      )
      console.log(
        'First run downloads ~1 GB and takes a few minutes; later re-seeds reuse the cache.'
      )
      if (!runOsmIngest(dataDir)) {
        console.warn(
          'OSM ingest failed — falling back to the fixture dataset only.'
        )
      }
    } else {
      console.warn(
        'osmium not found (`brew install osmium-tool`) — seeding the fixture dataset only.'
      )
    }
  }

  const inserted = await insertFixture(client)
  console.log(
    `Inserted ${inserted} fixture places (SK/CZ cities + European capitals).`
  )

  const byType = (
    await client.query<{placeType: string; count: string}>(
      `SELECT place_type AS "placeType", count(*) AS count
       FROM places
       GROUP BY place_type
       ORDER BY count(*) DESC`
    )
  ).rows
  console.log('Places DB seeded:')
  for (const row of byType) console.log(`  ${row.placeType}: ${row.count}`)

  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
