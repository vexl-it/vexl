/**
 * dev:mobile — build/run the Expo mobile app against a chosen backend.
 *
 * Reads the port map + mobile defaults from the committed dev.config.ts (the
 * single source of truth) and generates the ten `EXPO_PUBLIC_LOCAL_*_MS` service
 * URLs that apps/mobile/src/api/index.ts consumes, picking the right host for the
 * chosen target (iOS simulator → localhost, Android emulator → 10.0.2.2, physical
 * device → the machine's LAN IP). It then either just serves Metro, or also
 * prebuilds/builds the native binary, running the expo CLI in apps/mobile.
 *
 * ENV_PRESET (stage vs local) bakes native config, so switching presets forces a
 * `expo prebuild --clean`; changing only the local service URLs (host/ports) does
 * NOT — those are babel-inlined EXPO_PUBLIC vars that only need a Metro restart.
 *
 * Run: `pnpm dev:mobile [options]` — see printHelp() for flags.
 *
 * Dry run (no expo launched): `DEV_MOBILE_DRY_RUN=1 tsx tooling/dev/dev-mobile.ts ...`
 * prints the resolved env + the command(s) it WOULD run and exits 0.
 */
import {spawn} from 'node:child_process'
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {networkInterfaces} from 'node:os'
import {dirname, join} from 'node:path'
import devConfig, {devCryptoKeys} from '../../dev.config'
import {resolvePorts} from './ports'
import {loadSecrets, repoRoot} from './secrets'

// ---------------------------------------------------------------------------
// Service URL map — the EXACT env vars apps/mobile/src/api/index.ts reads,
// paired with their dev.config.ts port-map key. Order = the order they appear
// in api/index.ts. NOTE: the EXPO var is *_METRICS_MS even though the rest-api
// EnvPreset key is `metrics` — we match what api/index.ts actually reads.
// ---------------------------------------------------------------------------
const SERVICE_URL_MAP: ReadonlyArray<{
  readonly envVar: string
  readonly portKey: string
}> = [
  {envVar: 'EXPO_PUBLIC_LOCAL_USER_MS', portKey: 'userService'},
  {envVar: 'EXPO_PUBLIC_LOCAL_CONTACT_MS', portKey: 'contactService'},
  {envVar: 'EXPO_PUBLIC_LOCAL_CHAT_MS', portKey: 'chatService'},
  {envVar: 'EXPO_PUBLIC_LOCAL_OFFER_MS', portKey: 'offerService'},
  {envVar: 'EXPO_PUBLIC_LOCAL_LOCATION_MS', portKey: 'locationService'},
  {
    envVar: 'EXPO_PUBLIC_LOCAL_NOTIFICATION_MS',
    portKey: 'notificationService',
  },
  {
    envVar: 'EXPO_PUBLIC_LOCAL_BTC_EXCHANGE_RATE_MS',
    portKey: 'btcExchangeRateService',
  },
  {envVar: 'EXPO_PUBLIC_LOCAL_FEEDBACK_MS', portKey: 'feedbackService'},
  {envVar: 'EXPO_PUBLIC_LOCAL_CONTENT_MS', portKey: 'contentService'},
  {envVar: 'EXPO_PUBLIC_LOCAL_METRICS_MS', portKey: 'metricsService'},
]

const MOBILE_DIR = join(repoRoot, 'apps', 'mobile')
const EXPO_BIN = join(repoRoot, 'node_modules', '.bin', 'expo')
const LAST_PRESET_PATH = join(repoRoot, 'local', '.mobile-last-preset')

type Platform = 'ios' | 'android'
type Variant = 'dev' | 'release'
type EnvPreset = 'stage' | 'local'

// 'staging' uses committed stage URLs; 'local' uses the dev.config port map with
// a target-resolved host; 'host' is an explicit IP (optionally ip:basePort).
type BackendTarget =
  | {readonly kind: 'staging'}
  | {readonly kind: 'local'}
  | {
      readonly kind: 'host'
      readonly host: string
      readonly basePort?: number
    }

interface CliOptions {
  readonly platform: Platform
  readonly device?: string
  readonly backend: BackendTarget
  readonly variant: Variant
  readonly prebuild: boolean
  readonly build: boolean
  readonly host?: string
}

// --- arg parsing -----------------------------------------------------------

function parsePlatform(value: string | undefined): Platform {
  if (value === 'ios' || value === 'android') return value
  throw new Error(
    `--platform must be "ios" or "android" (got "${value ?? ''}")`
  )
}

function parseVariant(value: string | undefined): Variant {
  if (value === 'dev' || value === 'release') return value
  throw new Error(`--variant must be "dev" or "release" (got "${value ?? ''}")`)
}

function parseBackend(value: string | undefined): BackendTarget {
  if (value === undefined || value === 'local') return {kind: 'local'}
  if (value === 'staging' || value === 'stage') return {kind: 'staging'}

  // Explicit host, optionally `host:basePort`. Split on the LAST colon so the
  // port is whatever trails it; if that tail is not numeric, treat the whole
  // value as a bare host.
  const lastColon = value.lastIndexOf(':')
  if (lastColon > 0) {
    const host = value.slice(0, lastColon)
    const portText = value.slice(lastColon + 1)
    const basePort = Number(portText)
    if (Number.isFinite(basePort) && portText.length > 0) {
      return {kind: 'host', host, basePort}
    }
  }
  return {kind: 'host', host: value}
}

function parseArgs(argv: readonly string[]): CliOptions {
  let platform = parsePlatform(devConfig.mobile.defaultPlatform)
  let device: string | undefined
  let backend = parseBackend(devConfig.mobile.defaultBackend)
  let variant: Variant = 'dev'
  let prebuild = false
  let build = false
  let host: string | undefined

  const next = (i: number): string => {
    const value = argv[i]
    if (value === undefined) {
      throw new Error(`Missing value after ${argv[i - 1]}`)
    }
    return value
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--platform' || arg === '-p') {
      i += 1
      platform = parsePlatform(next(i))
    } else if (arg === '--device' || arg === '-d') {
      i += 1
      device = next(i)
    } else if (arg === '--backend' || arg === '-b') {
      i += 1
      backend = parseBackend(next(i))
    } else if (arg === '--variant' || arg === '-v') {
      i += 1
      variant = parseVariant(next(i))
    } else if (arg === '--host' || arg === '-H') {
      i += 1
      host = next(i)
    } else if (arg === '--prebuild' || arg === '-P') {
      prebuild = true
    } else if (arg === '--build' || arg === '-B') {
      build = true
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      console.error(`Unknown argument: ${arg}`)
      printHelp()
      process.exit(1)
    }
  }

  return {platform, device, backend, variant, prebuild, build, host}
}

function printHelp(): void {
  console.log(
    [
      'Usage: pnpm dev:mobile [options]',
      '',
      '  -p, --platform ios|android     target (default from dev.config.ts)',
      '  -d, --device <name|udid>       specific simulator/emulator/physical device',
      '  -b, --backend staging|local|<host>  which backend (default: local)',
      '  -v, --variant dev|release      dev-client (debug) vs release build (default: dev)',
      '  -H, --host <ip>                override the resolved host (always wins)',
      '  -P, --prebuild                 run `expo prebuild --clean` first (implies --build)',
      '  -B, --build                    compile & install the native binary, then serve',
      '  -h, --help                     show this help',
      '  (no build flag)                just start the Metro dev server',
      '',
      'Backend selection:',
      '  staging  -> ENV_PRESET=stage (committed stage URLs)',
      '  local    -> ENV_PRESET=local; generates EXPO_PUBLIC_LOCAL_*_MS from dev.config.ts',
      '  <host>   -> ENV_PRESET=local but with an explicit host (e.g. 192.168.1.5 or',
      '              192.168.1.5:3001 to also shift the base port)',
      '',
      'Host resolution (when --host is not given and backend is local):',
      '  --device given        -> machine LAN IP (physical device assumed)',
      '  iOS, no device        -> localhost',
      '  Android, no device    -> 10.0.2.2 (emulator host alias)',
      '',
      'Dry run: set DEV_MOBILE_DRY_RUN=1 to print the resolved env + command and exit.',
    ].join('\n')
  )
}

// --- host resolution -------------------------------------------------------

function detectLanIp(): string {
  const interfaces = networkInterfaces()
  // Prefer the conventional primary interfaces (macOS Wi-Fi/Ethernet, Linux).
  const preferred = ['en0', 'en1', 'eth0', 'wlan0']
  const candidates: Array<{readonly name: string; readonly address: string}> =
    []

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        candidates.push({name, address: address.address})
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      'Could not auto-detect a LAN IPv4 address. Pass --host <ip> explicitly.'
    )
  }

  for (const name of preferred) {
    const match = candidates.find((candidate) => candidate.name === name)
    if (match) return match.address
  }
  return candidates[0].address
}

interface ResolvedHost {
  readonly host: string
  readonly reason: string
}

function resolveHost(
  options: CliOptions,
  backend: BackendTarget
): ResolvedHost {
  if (options.host !== undefined) {
    return {host: options.host, reason: '--host override (always wins)'}
  }
  if (backend.kind === 'host') {
    return {host: backend.host, reason: 'explicit --backend host'}
  }
  // backend.kind === 'local'
  if (options.device !== undefined) {
    return {
      host: detectLanIp(),
      reason: `physical device assumed (--device ${options.device}) → LAN IP`,
    }
  }
  if (options.platform === 'android') {
    return {host: '10.0.2.2', reason: 'Android emulator host alias'}
  }
  return {host: 'localhost', reason: 'iOS simulator'}
}

// --- env generation --------------------------------------------------------

interface GeneratedEnv {
  readonly preset: EnvPreset
  readonly resolvedHost?: ResolvedHost
  readonly vars: Record<string, string>
  readonly serviceUrls: ReadonlyArray<readonly [string, string]>
}

function generateEnv(options: CliOptions): GeneratedEnv {
  const backend = options.backend

  if (backend.kind === 'staging') {
    return {
      preset: 'stage',
      vars: {ENV_PRESET: 'stage'},
      serviceUrls: [],
    }
  }

  // local or explicit host → ENV_PRESET=local + generated service URLs.
  const resolvedHost = resolveHost(options, backend)
  // Honor the same *_PORT overrides dev:backend honors (.env.local + shell env)
  // so the app points at exactly the ports the backend is published on.
  const overrideEnv: Record<string, string | undefined> = {
    ...process.env,
    ...loadSecrets(),
  }
  const ports = resolvePorts(devConfig.ports, overrideEnv)
  const defaultBasePort = ports.userService

  const serviceUrls = SERVICE_URL_MAP.map(({envVar, portKey}) => {
    const defaultPort = ports[portKey]
    // With an explicit `ip:basePort`, shift every service by the same offset it
    // has from the default user-service port, preserving the port layout.
    const port =
      backend.kind === 'host' && backend.basePort !== undefined
        ? backend.basePort + (defaultPort - defaultBasePort)
        : defaultPort
    const url = `http://${resolvedHost.host}:${port}`
    const pair: readonly [string, string] = [envVar, url]
    return pair
  })

  const vars: Record<string, string> = {ENV_PRESET: 'local'}
  for (const [envVar, url] of serviceUrls) {
    vars[envVar] = url
  }

  return {preset: 'local', resolvedHost, vars, serviceUrls}
}

// --- last-used preset (prebuild forcing) -----------------------------------

function readLastPreset(): EnvPreset | undefined {
  if (!existsSync(LAST_PRESET_PATH)) return undefined
  const value = readFileSync(LAST_PRESET_PATH, 'utf8').trim()
  if (value === 'stage' || value === 'local') return value
  return undefined
}

function writeLastPreset(preset: EnvPreset): void {
  mkdirSync(dirname(LAST_PRESET_PATH), {recursive: true})
  writeFileSync(LAST_PRESET_PATH, `${preset}\n`, 'utf8')
}

// --- command construction --------------------------------------------------

interface Command {
  readonly label: string
  readonly args: readonly string[]
}

function buildPrebuildCommand(options: CliOptions): Command {
  return {
    label: 'prebuild',
    args: ['prebuild', '--clean', '-p', options.platform],
  }
}

function buildRunCommand(options: CliOptions): Command {
  const args = [`run:${options.platform}`]
  if (options.device !== undefined) {
    args.push('--device', options.device)
  }
  if (options.variant === 'release') {
    if (options.platform === 'ios') {
      args.push('--configuration', 'Release')
    } else {
      args.push('--variant', 'release')
    }
  }
  return {label: 'build+run', args}
}

function buildServeCommand(): Command {
  return {label: 'serve', args: ['start', '--dev-client']}
}

// --- process execution -----------------------------------------------------

async function runToCompletion(
  command: Command,
  env: Record<string, string | undefined>
): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const child = spawn(EXPO_BIN, [...command.args], {
      cwd: MOBILE_DIR,
      env,
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code) => {
      resolve(code ?? 0)
    })
  })
}

async function runAttached(
  command: Command,
  env: Record<string, string | undefined>
): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const child = spawn(EXPO_BIN, [...command.args], {
      cwd: MOBILE_DIR,
      env,
      stdio: 'inherit',
    })

    const forward = (signal: NodeJS.Signals): void => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill(signal)
      }
    }
    process.on('SIGINT', () => {
      forward('SIGINT')
    })
    process.on('SIGTERM', () => {
      forward('SIGTERM')
    })

    child.once('error', reject)
    child.once('exit', (code) => {
      resolve(code ?? 0)
    })
  })
}

// --- summary ---------------------------------------------------------------

function printSummary(
  options: CliOptions,
  generated: GeneratedEnv,
  willPrebuild: boolean,
  willBuild: boolean,
  forcedPrebuildReason: string | undefined,
  commands: readonly Command[]
): void {
  const step = willPrebuild
    ? 'prebuild (--clean) → native build → serve'
    : willBuild
      ? 'native build → serve'
      : 'serve (expo start --dev-client)'

  console.log('')
  console.log('dev:mobile')
  console.log(`  platform:    ${options.platform}`)
  console.log(`  device:      ${options.device ?? '(default)'}`)
  console.log(`  variant:     ${options.variant}`)
  console.log(
    `  backend:     ${describeBackend(options.backend)} → ENV_PRESET=${generated.preset}`
  )
  if (generated.resolvedHost !== undefined) {
    console.log(
      `  host:        ${generated.resolvedHost.host} (${generated.resolvedHost.reason})`
    )
  } else {
    console.log('  host:        n/a (committed stage URLs)')
  }
  console.log(
    `  hmac:        backend SECRET_HMAC_KEY="${devCryptoKeys.SECRET_HMAC_KEY}" (matches mobile local preset)`
  )
  console.log(`  step:        ${step}`)
  if (forcedPrebuildReason !== undefined) {
    console.log(`  NOTE:        ${forcedPrebuildReason}`)
  }

  if (generated.serviceUrls.length > 0) {
    console.log('  service URLs:')
    for (const [envVar, url] of generated.serviceUrls) {
      console.log(`    ${envVar}=${url}`)
    }
  }

  console.log('  will run:')
  for (const command of commands) {
    console.log(`    expo ${command.args.join(' ')}   (${command.label})`)
  }
  console.log('')
}

function describeBackend(backend: BackendTarget): string {
  if (backend.kind === 'staging') return 'staging'
  if (backend.kind === 'local') return 'local'
  return backend.basePort !== undefined
    ? `host ${backend.host}:${backend.basePort}`
    : `host ${backend.host}`
}

// --- main ------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const generated = generateEnv(options)

  // Force a prebuild when the native-config preset (stage vs local) changed
  // since the last native build. Changing only the local service URLs stays a
  // Metro-only restart (EXPO_PUBLIC_* are babel-inlined, not native).
  const lastPreset = readLastPreset()
  const presetChanged =
    lastPreset !== undefined && lastPreset !== generated.preset
  const forcedPrebuildReason = presetChanged
    ? `ENV_PRESET changed ${lastPreset} → ${generated.preset}; forcing prebuild (native config: cleartext/package/entitlements).`
    : undefined

  const willPrebuild = options.prebuild || presetChanged
  const willBuild = options.build || willPrebuild

  const commands: Command[] = []
  if (willPrebuild) commands.push(buildPrebuildCommand(options))
  if (willBuild) commands.push(buildRunCommand(options))
  if (!willBuild) commands.push(buildServeCommand())

  printSummary(
    options,
    generated,
    willPrebuild,
    willBuild,
    forcedPrebuildReason,
    commands
  )

  if (process.env.DEV_MOBILE_DRY_RUN) {
    console.log('DEV_MOBILE_DRY_RUN set — resolved env that WOULD be injected:')
    for (const [key, value] of Object.entries(generated.vars)) {
      console.log(`  ${key}=${value}`)
    }
    if (Object.keys(generated.vars).length === 1) {
      console.log('  (no EXPO_PUBLIC_LOCAL_* vars — stage uses committed URLs)')
    }
    console.log('\nNot launching expo (dry run). Exiting 0.')
    process.exit(0)
  }

  const env: Record<string, string | undefined> = {
    ...process.env,
    ...generated.vars,
  }

  if (willPrebuild) {
    const code = await runToCompletion(buildPrebuildCommand(options), env)
    if (code !== 0) {
      throw new Error(`expo prebuild failed (exit ${code}).`)
    }
    // Native config now reflects this preset.
    writeLastPreset(generated.preset)
  }

  if (willBuild) {
    // A native build (with no preceding prebuild) still bakes the preset in.
    if (!willPrebuild) writeLastPreset(generated.preset)
    const code = await runAttached(buildRunCommand(options), env)
    process.exit(code)
  } else {
    const code = await runAttached(buildServeCommand(), env)
    process.exit(code)
  }
}

main().catch((error: unknown) => {
  console.error('\ndev:mobile failed:')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
