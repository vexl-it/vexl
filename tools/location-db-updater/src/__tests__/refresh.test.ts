/**
 * Tests for scripts/refresh.sh — the manual refresh entrypoint that downloads
 * OSM extracts, filters them with osmium and hands them to the ingest.
 *
 * The script runs for real; its external commands are replaced by stub
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
  realpathSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

const SCRIPT_PATH = path.resolve(__dirname, '../../scripts/refresh.sh')

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
echo "pnpm-env \${GEOCODING_DB_URL:-}" >> "$STUB_LOG"
exit 0
`

const NODE_STUB = `#!/bin/sh
if [ "$1" = "--enable-source-maps" ]; then
  echo "node $*" >> "$STUB_LOG"
  exit 0
fi
exec "${process.execPath}" "$@"
`

beforeEach(() => {
  // realpath so assertions match the script's pwd-canonicalized paths
  // (macOS tmpdir lives behind the /var -> /private/var symlink)
  workDir = realpathSync(mkdtempSync(path.join(tmpdir(), 'refresh-test-')))
  binDir = path.join(workDir, 'bin')
  dataDir = path.join(workDir, 'data')
  logPath = path.join(workDir, 'invocations.log')
  mkdirSync(binDir)
  writeFileSync(logPath, '')
  for (const [name, content] of [
    ['curl', CURL_STUB],
    ['osmium', OSMIUM_STUB],
    ['pnpm', PNPM_STUB],
    ['node', NODE_STUB],
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
  extraEnv: Record<string, string | undefined> = {},
  // /dev/null by default so a developer's real tools/location-db-updater/.env can
  // never leak into the tests (the script auto-loads it otherwise)
  configFile = '/dev/null',
  opts: {cwd?: string; dataDirArg?: string} = {}
): Promise<{code: number; stdout: string; stderr: string}> =>
  await new Promise((resolve) => {
    execFile(
      '/bin/sh',
      [
        SCRIPT_PATH,
        '-c',
        configFile,
        '-d',
        opts.dataDirArg ?? dataDir,
        ...args,
      ],
      {
        cwd: opts.cwd,
        env: {
          PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}`,
          STUB_LOG: logPath,
          STUB_DIR: workDir,
          GEOCODING_DB_URL: 'postgresql://localhost:5432/geocoding',
          GEOCODING_DB_USER: 'user',
          GEOCODING_DB_PASSWORD: 'password',
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

describe('refresh.sh', () => {
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
    const downloads = log.filter((one) => one.startsWith('curl'))
    expect(downloads).toHaveLength(2)
    for (const download of downloads) {
      expect(download).toContain('--progress-meter')
      expect(download).toContain('--location')
      expect(download).not.toMatch(/(?:^| )-s(?: |$)/)
    }
    expect(log.some((one) => one.startsWith('osmium fileinfo'))).toBe(true)
    expect(existsSync(path.join(dataDir, 'ne_countries.geojson'))).toBe(true)
    expect(existsSync(path.join(dataDir, 'raw/europe-latest.osm.pbf'))).toBe(
      true
    )
    expect(existsSync(path.join(dataDir, 'raw/europe-latest.osm.pbf.ok'))).toBe(
      true
    )

    // extract: four osmium tags-filter outputs with the expected filters
    const filters = log.filter((one) => one.includes('tags-filter'))
    expect(filters).toHaveLength(4)
    expect(filters[0]).toContain('n/place')
    expect(filters[1]).toContain('r/admin_level=6,7,8,9,10,11')
    expect(filters[1]).toContain('r/boundary=cadastral')
    expect(filters[1]).toContain(
      'wr/place=city,town,municipality,borough,village,suburb,quarter,neighbourhood,hamlet,city_block'
    )
    expect(filters[2]).toContain(
      'nwr/amenity=cafe,restaurant,pub,bar,fast_food'
    )
    expect(filters[2]).toContain('nwr/leisure=park,garden')
    expect(filters[2]).toContain('nwr/tourism=attraction,museum')
    expect(filters[3]).toContain(
      'w/highway=residential,living_street,pedestrian,primary,secondary,tertiary,unclassified'
    )
    for (const kind of ['places', 'boundaries', 'pois', 'streets']) {
      expect(
        existsSync(path.join(dataDir, `filtered/${kind}-europe.osm.pbf`))
      ).toBe(true)
    }

    // ingest: pnpm receives the countries file and all three filtered files
    const ingest = log.find((one) => one.startsWith('pnpm'))
    expect(ingest).toContain('ingest:geocoding')
    expect(ingest).toContain(`--countries ${dataDir}/ne_countries.geojson`)
    expect(ingest).toContain(`${dataDir}/filtered/places-europe.osm.pbf`)
    expect(ingest).toContain(`${dataDir}/filtered/boundaries-europe.osm.pbf`)
    expect(ingest).toContain(`${dataDir}/filtered/pois-europe.osm.pbf`)
    expect(ingest).toContain(`${dataDir}/filtered/streets-europe.osm.pbf`)
  })

  it('runs the compiled ingest in the container configuration', async () => {
    await runScript(['-r', 'europe', 'fetch'])
    writeFileSync(logPath, '')

    const run = await runScript(['-r', 'europe', 'extract', 'ingest'], {
      USE_COMPILED_INGEST: 'true',
    })

    expect(run.code).toEqual(0)
    expect(
      invocations().some((one) =>
        one.startsWith('node --enable-source-maps dist/ingest.js --countries')
      )
    ).toBe(true)
    expect(invocations().some((one) => one.startsWith('pnpm'))).toBe(false)
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
      4
    )
    expect(secondLog.some((one) => one.startsWith('pnpm'))).toBe(true)
  })

  it('rejects an unknown stage before doing any work', async () => {
    const run = await runScript(['-r', 'europe', 'ingset'])
    expect(run.code).toEqual(2)
    expect(run.stderr).toContain('unknown stage: ingset')
    expect(invocations()).toHaveLength(0)

    // getopts stops at the first positional, so a misplaced option lands in
    // the stage list and must be rejected the same way
    const misplaced = await runScript(['fetch', '-r', 'europe'])
    expect(misplaced.code).toEqual(2)
    expect(misplaced.stderr).toContain('unknown stage: -r')
    expect(invocations()).toHaveLength(0)
  })

  it('resolves a relative -d data dir so the ingest cd cannot break it', async () => {
    const run = await runScript(['-r', 'europe'], {}, '/dev/null', {
      cwd: workDir,
      dataDirArg: 'data',
    })
    expect(run.stderr).toEqual('')
    expect(run.code).toEqual(0)

    // dataDir is workDir/data, so the relative dir must resolve to it and the
    // ingest must receive absolute paths despite the script's cd
    const ingest = invocations().find((one) => one.startsWith('pnpm'))
    expect(ingest).toContain(`--countries ${dataDir}/ne_countries.geojson`)
    expect(ingest).toContain(`${dataDir}/filtered/places-europe.osm.pbf`)
    expect(existsSync(path.join(dataDir, 'ne_countries.geojson'))).toBe(true)
  })

  it('requires database credentials for the ingest stage', async () => {
    await runScript(['-r', 'europe', 'fetch', 'extract'])

    const run = await runScript(['-r', 'europe', 'ingest'], {
      GEOCODING_DB_URL: undefined,
    })
    expect(run.code).not.toEqual(0)
    expect(run.stderr).toContain('GEOCODING_DB_URL')
    expect(invocations().some((one) => one.startsWith('pnpm'))).toBe(false)
  })

  it('loads the access keys from the config file', async () => {
    const configPath = path.join(workDir, 'refresh.env')
    writeFileSync(
      configPath,
      [
        'GEOCODING_DB_URL=postgresql://config-host:5433/geocoding',
        'GEOCODING_DB_USER=config-user',
        'GEOCODING_DB_PASSWORD=config-password',
        '',
      ].join('\n')
    )

    const run = await runScript(
      ['-r', 'europe'],
      {
        GEOCODING_DB_URL: undefined,
        GEOCODING_DB_USER: undefined,
        GEOCODING_DB_PASSWORD: undefined,
      },
      configPath
    )
    expect(run.stderr).toEqual('')
    expect(run.code).toEqual(0)
    expect(invocations()).toContain(
      'pnpm-env postgresql://config-host:5433/geocoding'
    )
  })

  it('lets environment variables override the config file', async () => {
    const configPath = path.join(workDir, 'refresh.env')
    writeFileSync(
      configPath,
      'GEOCODING_DB_URL=postgresql://config-host:5433/geocoding\n'
    )

    const run = await runScript(['-r', 'europe'], {}, configPath)
    expect(run.code).toEqual(0)
    // The default env from runScript must win over the config file value
    expect(invocations()).toContain(
      'pnpm-env postgresql://localhost:5432/geocoding'
    )
  })

  it('appends timestamped progress to the log file in the data dir', async () => {
    const run = await runScript(['-r', 'europe', 'fetch'])
    expect(run.code).toEqual(0)

    const logContent = readFileSync(path.join(dataDir, 'refresh.log'), 'utf8')
    expect(logContent).toMatch(
      /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] === refresh started: stages \[fetch\]/m
    )
    expect(logContent).toContain('=== europe: downloading')
    expect(logContent).toContain('=== done: fetch')
  })
})
