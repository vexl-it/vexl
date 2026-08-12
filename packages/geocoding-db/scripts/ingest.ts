/**
 * Loads OSM places into the geocoding database. Three kinds of entries:
 *   - settlements (place=* nodes) — searchable and used for reverse geocoding
 *   - POIs (cafés, restaurants, pubs, parks, attractions, …) — searchable only
 *   - streets (named highway ways, deduplicated to one entry per street name
 *     per ~10 km grid cell, no house numbers) — searchable only
 *
 * Input: PBF files pre-filtered by scripts/refresh.sh (places-*, pois-*,
 * streets-*; the parser classifies each feature by its tags, so files can be
 * passed in any mix) + a Natural Earth admin-0 countries GeoJSON used to stamp
 * each entry with its ISO country code.
 *
 * The load is atomic: data goes into `places_ingest` / `place_names_ingest`
 * staging tables which replace the live tables in a single transaction at the
 * end, so the service keeps serving the old dataset until the new one is
 * complete. Deterministic and safe to re-run (manual refresh, see
 * scripts/refresh.sh).
 *
 * Usage:
 *   pnpm ingest:geocoding -- --countries <ne_countries.geojson> <*.osm.pbf>...
 *
 * Env: GEOCODING_DB_URL, GEOCODING_DB_USER, GEOCODING_DB_PASSWORD (same as the service).
 */
import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import pg from 'pg'
import {computeImportance} from '../src/common'
import {
  CountryIndex,
  parseFeature,
  type PlaceNameRow,
  type PlaceRow,
  type StreetSegmentRow,
} from './ingestParsing'

const BATCH_SIZE = 2000
/** Log running totals roughly every this many ingested rows. */
const PROGRESS_INTERVAL = 500_000

const timestamp = (): string =>
  new Date().toISOString().replace('T', ' ').slice(0, 19)

const log = (...args: unknown[]): void => {
  console.log(`[${timestamp()}]`, ...args)
}

const logError = (...args: unknown[]): void => {
  console.error(`[${timestamp()}]`, ...args)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const parseArgs = (): {countriesPath: string; pbfPaths: string[]} => {
  const args = process.argv.slice(2)
  let countriesPath: string | undefined
  const pbfPaths: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--countries') {
      countriesPath = args[i + 1]
      i++
    } else {
      pbfPaths.push(args[i])
    }
  }
  if (countriesPath === undefined || pbfPaths.length === 0) {
    logError(
      'Usage: ingestPlaces.ts --countries <ne_countries.geojson> <*.osm.pbf>...'
    )
    process.exit(1)
  }
  for (const path of [countriesPath, ...pbfPaths]) {
    if (!existsSync(path)) {
      logError(`File not found: ${path}`)
      process.exit(1)
    }
  }
  return {countriesPath, pbfPaths}
}

const connectDb = async (): Promise<pg.Client> => {
  const dbUrl = process.env.GEOCODING_DB_URL
  if (dbUrl === undefined) {
    logError('GEOCODING_DB_URL env var is required')
    process.exit(1)
  }
  const parsed = new URL(dbUrl)
  const client = new pg.Client({
    host: parsed.hostname,
    port: parsed.port !== '' ? Number(parsed.port) : 5432,
    database: parsed.pathname.slice(1),
    user: process.env.GEOCODING_DB_USER,
    password: process.env.GEOCODING_DB_PASSWORD,
  })
  await client.connect()
  return client
}

/** Multi-row INSERT, chunked to stay under the 65535 query parameter limit. */
const insertRows = async <T extends object>(
  client: pg.Client,
  table: string,
  columns: Array<Extract<keyof T, string>>,
  rows: T[],
  onConflict = ''
): Promise<void> => {
  const rowsPerQuery = Math.floor(60_000 / columns.length)
  for (let start = 0; start < rows.length; start += rowsPerQuery) {
    const chunk = rows.slice(start, start + rowsPerQuery)
    const values: unknown[] = []
    const tuples = chunk.map(
      (row) =>
        `(${columns
          .map((column) => {
            values.push(row[column])
            return `$${values.length}`
          })
          .join(', ')})`
    )
    await client.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${tuples.join(', ')} ${onConflict}`,
      values
    )
  }
}

const main = async (): Promise<void> => {
  const startedAt = Date.now()
  const {countriesPath, pbfPaths} = parseArgs()

  log(`Loading country boundaries from ${countriesPath}`)
  const countries = new CountryIndex(
    JSON.parse(await readFile(countriesPath, 'utf8'))
  )

  const client = await connectDb()

  await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
  await client.query(`CREATE EXTENSION IF NOT EXISTS cube`)
  await client.query(`CREATE EXTENSION IF NOT EXISTS earthdistance`)

  log('Preparing staging tables')
  await client.query(`DROP TABLE IF EXISTS place_names_ingest`)
  await client.query(`DROP TABLE IF EXISTS places_ingest`)
  await client.query(`DROP TABLE IF EXISTS street_segments_ingest`)
  await client.query(`
    CREATE UNLOGGED TABLE places_ingest (
      id bigint PRIMARY KEY,
      place_type varchar NOT NULL,
      name varchar NOT NULL,
      names jsonb NOT NULL DEFAULT '{}'::jsonb,
      country_code varchar,
      population bigint,
      importance real NOT NULL,
      latitude double precision NOT NULL,
      longitude double precision NOT NULL,
      geom_rank smallint NOT NULL DEFAULT 0
    )
  `)
  await client.query(`
    CREATE UNLOGGED TABLE place_names_ingest (
      place_id bigint NOT NULL,
      norm_name varchar NOT NULL,
      importance real NOT NULL
    )
  `)
  await client.query(`
    CREATE UNLOGGED TABLE street_segments_ingest (
      seg_id bigint NOT NULL,
      norm_name varchar NOT NULL,
      name varchar NOT NULL,
      country_code varchar,
      latitude double precision NOT NULL,
      longitude double precision NOT NULL,
      grid_lat integer NOT NULL,
      grid_lon integer NOT NULL
    )
  `)

  let totalPlaces = 0
  let totalNames = 0
  let totalSegments = 0
  let nextProgressAt = PROGRESS_INTERVAL
  let skippedDuplicates = 0
  let geometryUpgrades = 0
  // Numeric ids keep the dedupe map small. Street segments are excluded on
  // purpose (tens of millions) — the SQL GROUP BY dedupes them instead.
  const seenGeomRankById = new Map<number, number>()
  const placeBatchById = new Map<number, PlaceRow>()
  let placeBatch: PlaceRow[] = []
  let nameBatch: PlaceNameRow[] = []
  let segmentBatch: StreetSegmentRow[] = []

  const flush = async (): Promise<void> => {
    if (placeBatch.length > 0) {
      await insertRows(
        client,
        'places_ingest',
        [
          'id',
          'place_type',
          'name',
          'names',
          'country_code',
          'population',
          'importance',
          'latitude',
          'longitude',
          'geom_rank',
        ],
        placeBatch,
        `ON CONFLICT (id) DO UPDATE SET
           country_code = EXCLUDED.country_code,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           geom_rank = EXCLUDED.geom_rank
         WHERE places_ingest.geom_rank < EXCLUDED.geom_rank`
      )
      totalPlaces += placeBatch.length
      placeBatch = []
      placeBatchById.clear()
    }
    if (nameBatch.length > 0) {
      await insertRows(
        client,
        'place_names_ingest',
        ['place_id', 'norm_name', 'importance'],
        nameBatch
      )
      totalNames += nameBatch.length
      nameBatch = []
    }
    if (segmentBatch.length > 0) {
      await insertRows(
        client,
        'street_segments_ingest',
        [
          'seg_id',
          'norm_name',
          'name',
          'country_code',
          'latitude',
          'longitude',
          'grid_lat',
          'grid_lon',
        ],
        segmentBatch
      )
      totalSegments += segmentBatch.length
      segmentBatch = []
    }
    // Periodic progress for the multi-hour full-world ingest — per-file logs
    // alone can leave hours of silence on the big continent extracts.
    const processed = totalPlaces + totalNames + totalSegments
    if (processed >= nextProgressAt) {
      log(
        `  progress: ${totalPlaces} places, ${totalNames} names, ${totalSegments} street segments`
      )
      nextProgressAt = processed + PROGRESS_INTERVAL
    }
  }

  for (const pbfPath of pbfPaths) {
    log(`Ingesting ${pbfPath}`)
    const osmium = spawn(
      'osmium',
      [
        'export',
        pbfPath,
        '-f',
        'geojsonseq',
        '--add-unique-id=type_id',
        '--index-type=sparse_file_array',
      ],
      {stdio: ['ignore', 'pipe', 'inherit']}
    )

    const handleLine = async (line: string): Promise<void> => {
      const parsed = parseFeature(line, countries)
      if (parsed === null) return
      if (parsed.kind === 'street') {
        segmentBatch.push(parsed.segment)
        if (segmentBatch.length >= BATCH_SIZE) await flush()
        return
      }
      // The same id can arrive twice: an object shared by two continent
      // extracts (border areas), or a closed way exported both as an area
      // and as a linestring. Keep the first row, except a higher-ranked
      // geometry which upgrades the stored coordinates (its name rows are
      // identical, so they are never re-inserted).
      const numericId = Number(parsed.place.id)
      const previousRank = seenGeomRankById.get(numericId)
      if (
        previousRank !== undefined &&
        parsed.place.geom_rank <= previousRank
      ) {
        skippedDuplicates++
        return
      }
      seenGeomRankById.set(numericId, parsed.place.geom_rank)
      if (previousRank !== undefined) {
        geometryUpgrades++
        const batched = placeBatchById.get(numericId)
        if (batched !== undefined) {
          batched.country_code = parsed.place.country_code
          batched.latitude = parsed.place.latitude
          batched.longitude = parsed.place.longitude
          batched.geom_rank = parsed.place.geom_rank
          return
        }
        // The first row was already flushed — the insert's ON CONFLICT
        // clause upgrades it in the database instead
        placeBatchById.set(numericId, parsed.place)
        placeBatch.push(parsed.place)
        if (placeBatch.length >= BATCH_SIZE) await flush()
        return
      }
      placeBatchById.set(numericId, parsed.place)
      placeBatch.push(parsed.place)
      nameBatch.push(...parsed.names)
      if (placeBatch.length >= BATCH_SIZE) await flush()
    }

    // Subscribe before consuming stdout — the process usually exits while
    // the tail of its output is still being parsed and inserted, and a
    // listener attached only afterwards would miss the event and hang forever
    const closed = new Promise<number>((resolve) => {
      osmium.on('close', (code) => {
        resolve(code ?? 1)
      })
    })

    osmium.stdout.setEncoding('utf8')
    let pending = ''
    for await (const chunk of osmium.stdout) {
      pending += chunk
      const chunkLines = pending.split('\n')
      pending = chunkLines.pop() ?? ''
      for (const line of chunkLines) await handleLine(line)
    }
    if (pending.trim() !== '') await handleLine(pending)

    const exitCode = await closed
    if (exitCode !== 0) {
      logError(`osmium export failed for ${pbfPath} (exit ${exitCode})`)
      process.exit(1)
    }
    await flush()
    log(
      `  running totals: ${totalPlaces} places, ${totalNames} names, ${totalSegments} street segments`
    )
  }
  await flush()

  if (totalSegments > 0) {
    log('Merging street segments into street entries')
    const streetImportance = computeImportance('street', undefined)
    await client.query(
      `
      WITH
        grouped AS (
          SELECT
            min(seg_id) AS id,
            norm_name,
            min(name) AS name,
            min(country_code) AS country_code,
            avg(latitude) AS latitude,
            avg(longitude) AS longitude
          FROM
            street_segments_ingest
          GROUP BY
            norm_name,
            grid_lat,
            grid_lon
        ),
        inserted_places AS (
          INSERT INTO
            places_ingest (
              id,
              place_type,
              name,
              names,
              country_code,
              population,
              importance,
              latitude,
              longitude
            )
          SELECT
            id,
            'street',
            name,
            '{}'::jsonb,
            country_code,
            NULL,
            $1,
            latitude,
            longitude
          FROM
            grouped
          ON CONFLICT (id) DO NOTHING
          RETURNING
            id
        )
      INSERT INTO
        place_names_ingest (place_id, norm_name, importance)
      SELECT
        grouped.id,
        grouped.norm_name,
        $1
      FROM
        grouped
        JOIN inserted_places ON inserted_places.id = grouped.id
    `,
      [streetImportance]
    )
    await client.query(`DROP TABLE street_segments_ingest`)
  }

  // geom_rank only steers the ingest-time area-over-linestring dedupe
  await client.query(`ALTER TABLE places_ingest DROP COLUMN geom_rank`)

  // Streets/POIs near a city node rank above their same-named twins in small
  // towns. Capped at 0.5 so they always stay below the 0.55 "important"
  // threshold (and below every settlement of village rank and up).
  log('Boosting streets/POIs near important cities')
  await client.query(`
    WITH
      city_cells AS (
        -- Each city influences its own ~10 km grid cell plus the 8 neighbors
        SELECT
          round(latitude * 10)::int + neighbor_lat.delta AS grid_lat,
          round(longitude * 10)::int + neighbor_lon.delta AS grid_lon,
          max(importance) AS city_importance
        FROM
          places_ingest,
          (
            VALUES
              (-1),
              (0),
              (1)
          ) AS neighbor_lat (delta),
          (
            VALUES
              (-1),
              (0),
              (1)
          ) AS neighbor_lon (delta)
        WHERE
          place_type IN ('city', 'town')
        GROUP BY
          1,
          2
      )
    UPDATE places_ingest p
    SET
      importance = least(0.5, p.importance + 0.15 * cc.city_importance)
    FROM
      city_cells cc
    WHERE
      p.place_type NOT IN (
        'city',
        'town',
        'municipality',
        'borough',
        'village',
        'suburb',
        'quarter',
        'neighbourhood',
        'hamlet',
        'city_block'
      )
      AND round(p.latitude * 10)::int = cc.grid_lat
      AND round(p.longitude * 10)::int = cc.grid_lon
  `)
  await client.query(`
    UPDATE place_names_ingest pn
    SET
      importance = p.importance
    FROM
      places_ingest p
    WHERE
      pn.place_id = p.id
      AND p.place_type NOT IN (
        'city',
        'town',
        'municipality',
        'borough',
        'village',
        'suburb',
        'quarter',
        'neighbourhood',
        'hamlet',
        'city_block'
      )
  `)

  log('Building indexes')
  await client.query(`
    ALTER TABLE place_names_ingest
    ADD CONSTRAINT place_names_ingest_fk FOREIGN KEY (place_id) REFERENCES places_ingest (id) ON DELETE CASCADE
  `)
  await client.query(`
    CREATE INDEX "places_settlement_earth_IX_ingest" ON places_ingest USING gist (ll_to_earth (latitude, longitude))
    WHERE
      place_type IN (
        'city',
        'town',
        'municipality',
        'borough',
        'village',
        'suburb',
        'quarter',
        'neighbourhood',
        'hamlet',
        'city_block'
      )
  `)
  await client.query(
    `CREATE INDEX "places_type_IX_ingest" ON places_ingest (place_type)`
  )
  await client.query(`
    CREATE INDEX "places_city_earth_IX_ingest" ON places_ingest USING gist (ll_to_earth (latitude, longitude))
    WHERE
      place_type IN ('city', 'town')
  `)
  await client.query(`
    CREATE INDEX "place_names_place_id_IX_ingest" ON place_names_ingest (place_id)
  `)
  await client.query(`
    CREATE INDEX "place_names_prefix_IX_ingest" ON place_names_ingest (norm_name text_pattern_ops) INCLUDE (place_id, importance)
  `)
  await client.query(`
    CREATE INDEX "place_names_trgm_IX_ingest" ON place_names_ingest USING gin (norm_name gin_trgm_ops)
    WHERE
      importance >= 0.55
  `)
  await client.query(`
    CREATE INDEX "place_names_important_prefix_IX_ingest" ON place_names_ingest (norm_name text_pattern_ops) INCLUDE (place_id, importance)
    WHERE
      importance >= 0.55
  `)
  await client.query(`ALTER TABLE places_ingest SET LOGGED`)
  await client.query(`ALTER TABLE place_names_ingest SET LOGGED`)

  // Sanity gate: refuse to replace a healthy dataset with a much smaller one
  const placesTableExists = (
    await client.query<{exists: boolean}>(
      `SELECT to_regclass('places') IS NOT NULL AS exists`
    )
  ).rows[0].exists
  const newCount = (
    await client.query<{count: string}>(
      `SELECT count(*) AS count FROM places_ingest`
    )
  ).rows[0].count
  const previous = placesTableExists
    ? Number(
        (
          await client.query<{count: string}>(
            `SELECT count(*) AS count FROM places`
          )
        ).rows[0].count
      )
    : 0
  if (previous > 0 && Number(newCount) < previous * 0.7) {
    logError(
      `Sanity check failed: new dataset has ${newCount} places, previous had ${previous}. Aborting swap.`
    )
    process.exit(1)
  }

  log('Swapping tables')
  await client.query('BEGIN')
  try {
    await client.query(`DROP TABLE IF EXISTS place_names`)
    await client.query(`DROP TABLE IF EXISTS places`)
    await client.query(`ALTER TABLE places_ingest RENAME TO places`)
    await client.query(`ALTER TABLE place_names_ingest RENAME TO place_names`)
    // Constraints (and their backing indexes) keep their staging names on
    // table rename — realign them so re-runs don't leave stale _ingest names
    await client.query(
      `ALTER TABLE places RENAME CONSTRAINT places_ingest_pkey TO "PK_places"`
    )
    await client.query(
      `ALTER TABLE place_names RENAME CONSTRAINT place_names_ingest_fk TO place_names_fk`
    )
    await client.query(
      `ALTER INDEX "places_settlement_earth_IX_ingest" RENAME TO "places_settlement_earth_IX"`
    )
    await client.query(
      `ALTER INDEX "places_type_IX_ingest" RENAME TO "places_type_IX"`
    )
    await client.query(
      `ALTER INDEX "places_city_earth_IX_ingest" RENAME TO "places_city_earth_IX"`
    )
    await client.query(
      `ALTER INDEX "place_names_place_id_IX_ingest" RENAME TO "place_names_place_id_IX"`
    )
    await client.query(
      `ALTER INDEX "place_names_prefix_IX_ingest" RENAME TO "place_names_prefix_IX"`
    )
    await client.query(
      `ALTER INDEX "place_names_trgm_IX_ingest" RENAME TO "place_names_trgm_IX"`
    )
    await client.query(
      `ALTER INDEX "place_names_important_prefix_IX_ingest" RENAME TO "place_names_important_prefix_IX"`
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
  // VACUUM sets the visibility map so covering-index scans stay index-only.
  // PARALLEL 0 avoids shared-memory limits in constrained containers.
  await client.query(`VACUUM (ANALYZE, PARALLEL 0) places`)
  await client.query(`VACUUM (ANALYZE, PARALLEL 0) place_names`)

  const byType = (
    await client.query<{placeType: string; count: string}>(`
      SELECT
        place_type AS "placeType",
        count(*) AS count
      FROM
        places
      GROUP BY
        place_type
      ORDER BY
        count(*) DESC
    `)
  ).rows
  log(`\nDone in ${Math.round((Date.now() - startedAt) / 1000)}s`)
  log(
    `${totalPlaces} places, ${totalNames} names, ${totalSegments} street segments, ${skippedDuplicates} duplicates skipped, ${geometryUpgrades} geometry upgrades`
  )
  for (const row of byType) log(`  ${row.placeType}: ${row.count}`)

  await client.end()
}

main().catch((e) => {
  logError(e)
  process.exit(1)
})
