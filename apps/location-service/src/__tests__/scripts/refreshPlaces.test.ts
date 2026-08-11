/**
 * Tests for scripts/refresh-places.sh — the cron entrypoint that downloads
 * OSM extracts, filters them with osmium and hands them to the ingest.
 *
 * The script runs for real; `curl`, `osmium` and `pnpm` are replaced by stub
 * executables on PATH that record their invocations and produce controllable
 * outputs, so download validation, freshness/resume logic, failure handling
 * and stage orchestration are all covered without network or a database.
 */
import {execFile} from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

const SCRIPT_PATH = path.resolve(
  __dirname,
  '../../../scripts/refresh-places.sh'
)

let workDir: string
let binDir: string
let dataDir: string
let logPath: string

const CURL_STUB = `#!/bin/sh
echo "curl $*" >> "$STUB_LOG"
[ -f "$STUB_DIR/curl.fail" ] && exit 22
out=""
url=""
prev=""
for arg in "$@"; do
  [ "$prev" = "-o" ] && out="$arg"
  prev="$arg"
  case "$arg" in
    http*) url="$arg" ;;
  esac
done
case "$url" in
  *natural-earth*)
    if [ -f "$STUB_DIR/ne.invalid" ]; then
      echo 'this is not json' > "$out"
    else
      echo '{"type":"FeatureCollection","features":[]}' > "$out"
    fi
    ;;
  *)
    if [ -n "$out" ]; then echo "fake pbf from $url" > "$out"; fi
    ;;
esac
exit 0
`

const OSMIUM_STUB = `#!/bin/sh
echo "osmium $*" >> "$STUB_LOG"
if [ "$1" = "fileinfo" ]; then
  [ -f "$STUB_DIR/fileinfo.fail" ] && exit 1
  exit 0
fi
out=""
prev=""
for arg in "$@"; do
  [ "$prev" = "-o" ] && out="$arg"
  prev="$arg"
done
[ -n "$out" ] && echo "filtered" > "$out"
exit 0
`

const PNPM_STUB = `#!/bin/sh
echo "pnpm $*" >> "$STUB_LOG"
exit 0
`

beforeEach(() => {
  workDir = mkdtempSync(path.join(tmpdir(), 'refresh-places-test-'))
  binDir = path.join(workDir, 'bin')
  dataDir = path.join(workDir, 'data')
  logPath = path.join(workDir, 'invocations.log')
  mkdirSync(binDir)
  writeFileSync(logPath, '')
  for (const [name, content] of [
    ['curl', CURL_STUB],
    ['osmium', OSMIUM_STUB],
    ['pnpm', PNPM_STUB],
  ] as const) {
    const stubPath = path.join(binDir, name)
    writeFileSync(stubPath, content)
    chmodSync(stubPath, 0o755)
  }
})

afterEach(() => {
  rmSync(workDir, {recursive: true, force: true})
})

const runScript = async (
  args: string[],
  extraEnv: Record<string, string | undefined> = {}
): Promise<{code: number; stdout: string; stderr: string}> =>
  await new Promise((resolve) => {
    execFile(
      '/bin/sh',
      [SCRIPT_PATH, '-d', dataDir, ...args],
      {
        env: {
          PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}`,
          STUB_LOG: logPath,
          STUB_DIR: workDir,
          DB_URL: 'postgresql://localhost:5432/places',
          DB_USER: 'user',
          DB_PASSWORD: 'password',
          ...extraEnv,
        },
      },
      (error, stdout, stderr) => {
        const code =
          error === null ? 0 : typeof error.code === 'number' ? error.code : 1
        resolve({code, stdout, stderr})
      }
    )
  })

const invocations = (): string[] =>
  readFileSync(logPath, 'utf8').split('\n').filter(Boolean)

describe('refresh-places.sh', () => {
  it('runs all three stages for a region: fetch, extract, ingest', async () => {
    const run = await runScript(['-r', 'europe'])
    expect(run.stderr).toEqual('')
    expect(run.code).toEqual(0)

    const log = invocations()

    // fetch: Natural Earth boundaries + the region extract, both validated
    expect(
      log.filter((one) => one.includes('natural-earth-vector'))
    ).toHaveLength(1)
    expect(
      log.filter((one) =>
        one.includes('https://download.geofabrik.de/europe-latest.osm.pbf')
      )
    ).toHaveLength(1)
    expect(log.some((one) => one.startsWith('osmium fileinfo'))).toBe(true)
    expect(existsSync(path.join(dataDir, 'ne_countries.geojson'))).toBe(true)
    expect(existsSync(path.join(dataDir, 'raw/europe-latest.osm.pbf'))).toBe(
      true
    )
    expect(existsSync(path.join(dataDir, 'raw/europe-latest.osm.pbf.ok'))).toBe(
      true
    )

    // extract: three osmium tags-filter outputs with the expected filters
    const filters = log.filter((one) => one.includes('tags-filter'))
    expect(filters).toHaveLength(3)
    expect(filters[0]).toContain('n/place')
    expect(filters[1]).toContain(
      'nwr/amenity=cafe,restaurant,pub,bar,fast_food'
    )
    expect(filters[1]).toContain('nwr/leisure=park,garden')
    expect(filters[1]).toContain('nwr/tourism=attraction,museum')
    expect(filters[2]).toContain(
      'w/highway=residential,living_street,pedestrian,primary,secondary,tertiary,unclassified'
    )
    for (const kind of ['places', 'pois', 'streets']) {
      expect(
        existsSync(path.join(dataDir, `filtered/${kind}-europe.osm.pbf`))
      ).toBe(true)
    }

    // ingest: pnpm receives the countries file and all three filtered files
    const ingest = log.find((one) => one.startsWith('pnpm'))
    expect(ingest).toContain('ingest:places')
    expect(ingest).toContain(`--countries ${dataDir}/ne_countries.geojson`)
    expect(ingest).toContain(`${dataDir}/filtered/places-europe.osm.pbf`)
    expect(ingest).toContain(`${dataDir}/filtered/pois-europe.osm.pbf`)
    expect(ingest).toContain(`${dataDir}/filtered/streets-europe.osm.pbf`)
  })

  it('defaults to the eight continent regions', async () => {
    const run = await runScript(['fetch'])
    expect(run.code).toEqual(0)

    const downloads = invocations().filter((one) =>
      one.includes('download.geofabrik.de')
    )
    expect(downloads).toHaveLength(8)
    for (const region of [
      'africa',
      'antarctica',
      'asia',
      'australia-oceania',
      'central-america',
      'europe',
      'north-america',
      'south-america',
    ]) {
      expect(
        downloads.some((one) => one.includes(`/${region}-latest.osm.pbf`))
      ).toBe(true)
    }
  })

  it('flattens sub-region paths into filenames but keeps them in URLs', async () => {
    const run = await runScript(['-r', 'europe/slovakia', 'fetch', 'extract'])
    expect(run.code).toEqual(0)

    expect(
      invocations().some((one) =>
        one.includes('download.geofabrik.de/europe/slovakia-latest.osm.pbf')
      )
    ).toBe(true)
    expect(
      existsSync(path.join(dataDir, 'raw/europe-slovakia-latest.osm.pbf.ok'))
    ).toBe(true)
    expect(
      existsSync(path.join(dataDir, 'filtered/places-europe-slovakia.osm.pbf'))
    ).toBe(true)
  })

  it('reuses a fresh validated extract instead of re-downloading', async () => {
    await runScript(['-r', 'europe', 'fetch'])
    writeFileSync(logPath, '')

    const run = await runScript(['-r', 'europe', 'fetch'])
    expect(run.code).toEqual(0)
    expect(run.stdout).toContain('raw extract is fresh, skipping fetch')
    expect(
      invocations().filter((one) => one.includes('download.geofabrik.de'))
    ).toHaveLength(0)
  })

  it('re-downloads when the validated extract is older than the window', async () => {
    await runScript(['-r', 'europe', 'fetch'])
    writeFileSync(logPath, '')
    const okPath = path.join(dataDir, 'raw/europe-latest.osm.pbf.ok')
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000)
    utimesSync(okPath, old, old)

    const run = await runScript(['-r', 'europe', 'fetch'])
    expect(run.code).toEqual(0)
    expect(
      invocations().filter((one) => one.includes('download.geofabrik.de'))
    ).toHaveLength(1)
  })

  it('never caches a Natural Earth download that is not valid JSON', async () => {
    writeFileSync(path.join(workDir, 'ne.invalid'), '')

    const run = await runScript(['-r', 'europe', 'fetch'])
    expect(run.code).not.toEqual(0)
    expect(existsSync(path.join(dataDir, 'ne_countries.geojson'))).toBe(false)
  })

  it('fails without leaving a validation marker when the download fails', async () => {
    // Let the NE file succeed first so the failure hits the region download
    await runScript(['-r', 'europe', 'fetch'])
    rmSync(path.join(dataDir, 'raw'), {recursive: true})
    writeFileSync(path.join(workDir, 'curl.fail'), '')

    const run = await runScript(['-r', 'europe', 'fetch'])
    expect(run.code).not.toEqual(0)
    expect(existsSync(path.join(dataDir, 'raw/europe-latest.osm.pbf.ok'))).toBe(
      false
    )
  })

  it('fails without a validation marker when the extract is corrupt', async () => {
    writeFileSync(path.join(workDir, 'fileinfo.fail'), '')

    const run = await runScript(['-r', 'europe', 'fetch'])
    expect(run.code).not.toEqual(0)
    expect(existsSync(path.join(dataDir, 'raw/europe-latest.osm.pbf.ok'))).toBe(
      false
    )
  })

  it('discards a stale download before retrying instead of resuming it', async () => {
    await runScript(['-r', 'europe', 'fetch'])
    const rawPath = path.join(dataDir, 'raw/europe-latest.osm.pbf')
    writeFileSync(rawPath, 'stale partial content')
    const okPath = `${rawPath}.ok`
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000)
    utimesSync(okPath, old, old)

    const run = await runScript(['-r', 'europe', 'fetch'])
    expect(run.code).toEqual(0)
    // The stub always writes a full file — a resume (-C) would have appended
    expect(readFileSync(rawPath, 'utf8')).toEqual(
      'fake pbf from https://download.geofabrik.de/europe-latest.osm.pbf\n'
    )
    expect(
      invocations().some((one) => one.startsWith('curl') && one.includes('-C'))
    ).toBe(false)
  })

  it('refuses to extract without a validated raw extract', async () => {
    const run = await runScript(['-r', 'europe', 'extract'])
    expect(run.code).toEqual(1)
    expect(run.stderr).toContain('no validated raw extract')
  })

  it('runs only the requested stages', async () => {
    const run = await runScript(['-r', 'europe', 'fetch'])
    expect(run.code).toEqual(0)

    const log = invocations()
    expect(log.some((one) => one.includes('tags-filter'))).toBe(false)
    expect(log.some((one) => one.startsWith('pnpm'))).toBe(false)

    writeFileSync(logPath, '')
    const secondRun = await runScript(['-r', 'europe', 'extract', 'ingest'])
    expect(secondRun.code).toEqual(0)
    const secondLog = invocations()
    expect(secondLog.some((one) => one.includes('download.geofabrik.de'))).toBe(
      false
    )
    expect(secondLog.filter((one) => one.includes('tags-filter'))).toHaveLength(
      3
    )
    expect(secondLog.some((one) => one.startsWith('pnpm'))).toBe(true)
  })

  it('requires database credentials for the ingest stage', async () => {
    await runScript(['-r', 'europe', 'fetch', 'extract'])

    const run = await runScript(['-r', 'europe', 'ingest'], {
      DB_URL: undefined,
    })
    expect(run.code).not.toEqual(0)
    expect(run.stderr).toContain('DB_URL')
    expect(invocations().some((one) => one.startsWith('pnpm'))).toBe(false)
  })
})
