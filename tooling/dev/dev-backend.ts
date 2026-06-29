/**
 * dev:backend — supervisor for the local backend stack.
 *
 * Brings up dockerized infra + observability, then spawns the selected backend
 * services and web apps as supervised host node processes with per-service env
 * injected from dev.config.ts (+ .env.local overrides). Tees logs to the console
 * and to local/services-logs/<name>.log (JSONL for Alloy/Loki), polls readiness,
 * prints a summary, and shuts everything down cleanly on SIGINT.
 *
 * Run: `pnpm dev:backend [options]` — see parseArgs() for flags.
 */
import {Array, pipe} from 'effect'
import {spawn, type ChildProcess} from 'node:child_process'
import {join} from 'node:path'
import devConfig from '../../dev.config'
import * as docker from './docker'
import {checkOnce, readinessTarget, waitUntilReady} from './health'
import {createServiceLogger, ensureLogsDir, type ServiceLogger} from './logging'
import {createLokiPusher, type LokiPusher} from './loki'
import {findDuplicatePorts, isPortFree, resolvePorts} from './ports'
import {loadRawEnvLocal, loadSecrets, repoRoot, type Secrets} from './secrets'
import {
  ALL_APPS,
  buildFinalEnv,
  findApp,
  SERVICES,
  WEB_APPS,
  type EnvContext,
  type RunnableApp,
} from './services'

interface CliOptions {
  readonly only: readonly string[]
  readonly skip: readonly string[]
  readonly web: boolean
  readonly observability: boolean
  readonly watch: boolean
  readonly freshDb: boolean
  readonly detachInfra: boolean
}

function parseArgs(argv: readonly string[]): CliOptions {
  let only: string[] = []
  let skip: string[] = []
  let web = true
  let observability = true
  let watch = false
  let freshDb = false
  let detachInfra = false

  const splitList = (value: string): string[] =>
    pipe(
      value.split(','),
      Array.map((part) => part.trim()),
      Array.filter((part) => part.length > 0)
    )

  const nextListValue = (i: number): string => {
    const value = argv[i]
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value after ${argv[i - 1]}`)
    }
    return value
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--only') {
      i += 1
      only = splitList(nextListValue(i))
    } else if (arg === '--skip') {
      i += 1
      skip = splitList(nextListValue(i))
    } else if (arg === '--no-web') {
      web = false
    } else if (arg === '--no-observability') {
      observability = false
    } else if (arg === '--watch') {
      watch = true
    } else if (arg === '--fresh-db') {
      freshDb = true
    } else if (arg === '--detach-infra') {
      detachInfra = true
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      console.error(`Unknown argument: ${arg}`)
      printHelp()
      process.exit(1)
    }
  }

  return {only, skip, web, observability, watch, freshDb, detachInfra}
}

function printHelp(): void {
  console.log(
    [
      'Usage: pnpm dev:backend [options]',
      '',
      '  --only <a,b>        run only these services/apps',
      '  --skip <a,b>        run everything except these',
      '  --no-web            skip the web apps (backoffice/account-deletion/dashboard)',
      '  --no-observability  skip Loki/Tempo/Grafana',
      '  --watch             hot-reload services via tsx watch (default off)',
      '  --fresh-db          recreate databases from scratch (docker compose down -v)',
      '  --detach-infra      leave docker infra running on exit',
    ].join('\n')
  )
}

// --- selection -------------------------------------------------------------

function selectApps(options: CliOptions): readonly RunnableApp[] {
  const validateNames = (
    names: readonly string[],
    optionName: string
  ): void => {
    const unknown = pipe(
      names,
      Array.filter((name) => findApp(name) === undefined)
    )
    if (Array.isNonEmptyReadonlyArray(unknown)) {
      throw new Error(
        `Unknown app name in ${optionName}: ${unknown.join(', ')}. Known apps: ${pipe(
          ALL_APPS,
          Array.map((app) => app.name)
        ).join(', ')}`
      )
    }
  }

  validateNames(options.only, '--only')
  validateNames(options.skip, '--skip')

  const candidates = Array.isNonEmptyReadonlyArray(options.only)
    ? pipe(
        ALL_APPS,
        Array.filter((app) => options.only.includes(app.name))
      )
    : [...SERVICES, ...(options.web ? WEB_APPS : [])]

  return pipe(
    candidates,
    Array.filter((app) => !options.skip.includes(app.name))
  )
}

// --- env -------------------------------------------------------------------

// Alloy is intentionally gone: the supervisor pushes logs to Loki directly (see
// loki.ts) instead of an in-container agent tailing host files.
const OBSERVABILITY_SERVICES = ['loki', 'tempo', 'grafana']
const INFRA_SERVICES = ['postgres', 'redis', 'minio']

function buildDockerEnv(ctx: EnvContext, secrets: Secrets): docker.DockerEnv {
  const {infra} = ctx.cfg
  return {
    ...process.env,
    POSTGRES_USER: infra.postgres.user,
    POSTGRES_PASSWORD: infra.postgres.password,
    POSTGRES_DB: 'postgres',
    POSTGRES_PORT: String(ctx.ports.postgres),
    REDIS_PORT: String(ctx.ports.redis),
    MINIO_ROOT_USER: infra.minio.rootUser,
    MINIO_ROOT_PASSWORD: infra.minio.rootPassword,
    MINIO_API_PORT: String(ctx.ports.minioApi),
    MINIO_CONSOLE_PORT: String(ctx.ports.minioConsole),
    S3_BUCKET_NAME: infra.minio.bucket,
    GRAFANA_PORT: String(ctx.ports.grafana),
    LOKI_PORT: String(ctx.ports.loki),
    TEMPO_PORT: String(ctx.ports.tempo),
    TEMPO_OTLP_HTTP_PORT: String(ctx.ports.tempoOtlpHttp),
    TEMPO_OTLP_GRPC_PORT: String(ctx.ports.tempoOtlpGrpc),
    // Optional docker credentials from .env.local may override local defaults.
    ...secrets,
  }
}

// --- port validation -------------------------------------------------------

async function validatePorts(
  ctx: EnvContext,
  apps: readonly RunnableApp[]
): Promise<void> {
  const infraPortKeys = [
    'postgres',
    'redis',
    'minioApi',
    'minioConsole',
    'grafana',
    'loki',
    'tempo',
    'tempoOtlpHttp',
    'tempoOtlpGrpc',
  ]

  const appPortAssignments = (
    app: RunnableApp
  ): ReadonlyArray<{
    readonly label: string
    readonly port: number
  }> => [
    {label: app.name, port: ctx.ports[app.portKey]},
    ...pipe(
      app.extraPortKeys ?? [],
      Array.map((portKey) => ({
        label: `${app.name} (${portKey})`,
        port: ctx.ports[portKey],
      }))
    ),
    ...(app.healthPortKey !== undefined
      ? [
          {
            label: `${app.name} (health)`,
            port: ctx.healthPorts[app.healthPortKey],
          },
        ]
      : []),
  ]

  const assignments = [
    ...pipe(
      infraPortKeys,
      Array.map((key) => ({label: key, port: ctx.ports[key]}))
    ),
    ...pipe(apps, Array.flatMap(appPortAssignments)),
  ]

  const duplicates = findDuplicatePorts(assignments)
  if (Array.isNonEmptyReadonlyArray(duplicates)) {
    for (const {port, labels} of duplicates) {
      console.error(
        `Port ${port} is assigned to multiple: ${labels.join(', ')}`
      )
    }
    throw new Error('Port map has collisions — fix dev.config.ts / overrides.')
  }

  // Only host-bound ports are checked for freeness; docker manages infra ports
  // (and may already hold them when re-running with --detach-infra).
  const hostPorts = pipe(apps, Array.flatMap(appPortAssignments))

  const inUse: string[] = []
  for (const {label, port} of hostPorts) {
    if (!(await isPortFree(port))) inUse.push(`${label} -> ${port}`)
  }
  if (Array.isNonEmptyArray(inUse)) {
    throw new Error(
      `These host ports are already in use:\n  ${inUse.join('\n  ')}\nStop the other process or override the port in .env.local.`
    )
  }
}

// --- process supervision ---------------------------------------------------

interface Supervised {
  readonly app: RunnableApp
  readonly child: ChildProcess
  readonly logger: ServiceLogger
}

function spawnApp(
  app: RunnableApp,
  ctx: EnvContext,
  secrets: Secrets,
  watch: boolean,
  logger: ServiceLogger
): ChildProcess {
  const env = {...process.env, ...buildFinalEnv(app, ctx, secrets)}

  const spec = app.run
  const command =
    spec.type === 'tsx'
      ? {
          file: join(repoRoot, 'node_modules', '.bin', 'tsx'),
          args: watch ? ['watch', spec.entry] : [spec.entry],
          cwd: join(repoRoot, app.dir),
        }
      : {
          file: 'pnpm',
          args: ['--filter', app.workspaceName, 'run', spec.script],
          cwd: repoRoot,
        }

  logger.note(
    `Starting (${command.file.split('/').pop() ?? command.file} ${command.args.join(' ')})`
  )

  const child = spawn(command.file, command.args, {
    cwd: command.cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    // Own process group so we can signal the whole tree on shutdown. The
    // dashboard `dev` script forks `dev:server` + `dev:client` via `&`; a
    // single-pid kill would orphan those grandchildren.
    detached: true,
  })

  child.stdout?.on('data', (chunk: Buffer) => {
    logger.feed('stdout', chunk.toString('utf8'))
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    logger.feed('stderr', chunk.toString('utf8'))
  })

  return child
}

/**
 * Signal the child's entire process group (it is a group leader because we spawn
 * with `detached: true`). Falls back to a single-pid kill. This reaps
 * grandchildren such as the dashboard `dev` script's `dev:server`/`dev:client`.
 */
function killTree(child: ChildProcess, signal: NodeJS.Signals): void {
  const pid = child.pid
  if (pid === undefined) return
  try {
    process.kill(-pid, signal)
  } catch {
    try {
      child.kill(signal)
    } catch {
      // Process already gone.
    }
  }
}

// --- summary ---------------------------------------------------------------

interface SummaryRow {
  readonly component: string
  readonly url: string
  readonly status: string
}

function printSummary(rows: readonly SummaryRow[]): void {
  const widthOf = (pick: (row: SummaryRow) => string, header: string): number =>
    Math.max(
      header.length,
      ...pipe(
        rows,
        Array.map((row) => pick(row).length)
      )
    )

  const cw = widthOf((r) => r.component, 'COMPONENT')
  const uw = widthOf((r) => r.url, 'URL')
  const sw = widthOf((r) => r.status, 'STATUS')

  const line = (c: string, u: string, s: string): string =>
    `  ${c.padEnd(cw)}  ${u.padEnd(uw)}  ${s.padEnd(sw)}`

  console.log('')
  console.log(line('COMPONENT', 'URL', 'STATUS'))
  console.log(line('-'.repeat(cw), '-'.repeat(uw), '-'.repeat(sw)))
  for (const row of rows) console.log(line(row.component, row.url, row.status))
  console.log('')
}

// --- main ------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const secrets = loadSecrets()

  // Port overrides may come from the shell or the RAW `.env.local` (only
  // `<NAME>_PORT` keys are ever read here, so legacy structural keys are inert).
  const overrideEnv: Record<string, string | undefined> = {
    ...process.env,
    ...loadRawEnvLocal(),
  }
  const ctx: EnvContext = {
    cfg: devConfig,
    ports: resolvePorts(devConfig.ports, overrideEnv),
    healthPorts: devConfig.healthPorts,
  }

  const apps = selectApps(options)
  if (!Array.isNonEmptyReadonlyArray(apps)) {
    console.error('No apps selected. Check --only/--skip.')
    process.exit(1)
  }

  console.log(
    `Selected: ${pipe(
      apps,
      Array.map((app) => app.name)
    ).join(', ')}`
  )

  await validatePorts(ctx, apps)
  ensureLogsDir()

  const dockerEnv = buildDockerEnv(ctx, secrets)

  if (!docker.configValid(dockerEnv)) {
    throw new Error(
      'docker-compose.dev.yaml failed to parse (docker compose config).'
    )
  }

  if (options.freshDb) {
    console.log('Recreating infra volumes (--fresh-db)...')
    docker.downWithVolumes(dockerEnv)
  }

  const composeServices = [
    ...INFRA_SERVICES,
    ...(options.observability ? OBSERVABILITY_SERVICES : []),
  ]
  console.log(`Starting infra: ${composeServices.join(', ')}`)
  if (!docker.up(dockerEnv, composeServices, true)) {
    throw new Error('docker compose up failed for infra.')
  }

  console.log('Initializing MinIO bucket...')
  if (!docker.runMinioInit(dockerEnv)) {
    console.warn('MinIO init returned non-zero (bucket may already exist).')
  }

  const supervised: Supervised[] = []
  let shuttingDown = false

  const lokiPusher: LokiPusher | undefined = options.observability
    ? createLokiPusher(
        `http://${ctx.cfg.infra.host}:${ctx.ports.loki}/loki/api/v1/push`
      )
    : undefined

  const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`\nReceived ${signal}, shutting down...`)

    await Promise.all(
      pipe(
        supervised,
        Array.map(async ({app, child, logger}) => {
          if (child.exitCode === null && child.signalCode === null) {
            await new Promise<void>((resolve) => {
              const force = setTimeout(() => {
                killTree(child, 'SIGKILL')
              }, 5000)
              child.once('exit', () => {
                clearTimeout(force)
                resolve()
              })
              logger.note(`Stopping ${app.name}...`)
              killTree(child, 'SIGTERM')
            })
          }
          await logger.close()
        })
      )
    )

    // Flush remaining logs to Loki before the container goes away.
    if (lokiPusher !== undefined) {
      await lokiPusher.close()
    }

    if (!options.detachInfra) {
      console.log('Stopping docker infra...')
      docker.stop(dockerEnv)
    } else {
      console.log('Leaving docker infra running (--detach-infra).')
    }
    process.exit(exitCode)
  }

  process.on('SIGINT', () => {
    void shutdown('SIGINT')
  })
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM')
  })

  // Spawn all selected apps.
  for (const [index, app] of apps.entries()) {
    const logger = createServiceLogger(app.name, index, lokiPusher)
    const child = spawnApp(app, ctx, secrets, options.watch, logger)
    child.once('error', (error) => {
      if (shuttingDown) return
      logger.note(`Spawn failed: ${error.message}`)
      void shutdown(`spawn error in ${app.name}`, 1)
    })
    child.once('exit', (code, signal) => {
      if (shuttingDown) return
      logger.note(
        `Exited (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`
      )
    })
    supervised.push({app, child, logger})
  }

  // Poll readiness for each app (concurrently).
  console.log('\nWaiting for services to become ready...')
  const results = await Promise.all(
    pipe(
      apps,
      Array.map(async (app) => {
        const target = readinessTarget(app, ctx)
        const ready = await waitUntilReady(target, {
          timeoutMs: 90_000,
          intervalMs: 1000,
        })
        return {app, target, ready}
      })
    )
  )

  const rows: SummaryRow[] = pipe(
    results,
    Array.map(({app, target, ready}) => ({
      component: app.name,
      url:
        target.kind === 'http'
          ? `http://${ctx.cfg.infra.host}:${ctx.ports[app.portKey]}`
          : `tcp://${target.host}:${target.port}`,
      status: ready ? 'ready' : 'NOT READY',
    }))
  )

  if (options.observability) {
    rows.push({
      component: 'grafana (logs+traces)',
      url: `http://${ctx.cfg.infra.host}:${ctx.ports.grafana}`,
      status: (await checkOnce(
        {
          kind: 'http',
          url: `http://${ctx.cfg.infra.host}:${ctx.ports.grafana}/api/health`,
        },
        2000
      ))
        ? 'ready'
        : 'starting',
    })
  }

  printSummary(rows)
  if (options.observability) {
    const grafanaUrl = `http://${ctx.cfg.infra.host}:${ctx.ports.grafana}`
    console.log(`  📊 Grafana (logs + traces): ${grafanaUrl}`)
    console.log(`     Explore logs:            ${grafanaUrl}/explore\n`)
  }
  console.log(
    'Stack is up. Logs: local/services-logs/. Press Ctrl+C to stop.\n'
  )
}

main().catch((error: unknown) => {
  console.error('\ndev:backend failed:')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
