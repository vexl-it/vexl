#!/usr/bin/env node
import {NodeRuntime} from '@effect/platform-node'
import {Command} from 'commander'
import {Cause, Effect} from 'effect'
import type {ChildProcess} from 'node:child_process'
import {
  formatStartupError,
  type LanIpDetectionError,
  type StartupError,
} from './errors/index.js'
import {checkAllServicesHealth} from './health/index.js'
import {
  type BuildMode,
  detectLanIpWithPrompt,
  findAvailableMetroPort,
  type MobileCommandConfig,
  selectDeviceInteractively,
  startExpoWithMode,
} from './mobile/index.js'
import {logError, logSuccess, logWithPrefix} from './ui/logger.js'

/**
 * CLI options from Commander.js
 *
 * Note: device can be:
 * - undefined: no -d flag used
 * - true: -d flag used without value (triggers interactive selection)
 * - string: -d flag used with explicit device name/ID
 */
interface MobileOptions {
  platform: 'ios' | 'android'
  prebuild?: boolean
  build?: boolean
  device?: string | boolean
  host?: string
}

/**
 * Determine build mode from CLI flags.
 * Priority: --prebuild > --build > expo-go (default)
 */
const getBuildMode = (options: MobileOptions): BuildMode => {
  if (options.prebuild) return 'prebuild'
  if (options.build) return 'native-build'
  return 'expo-go'
}

/**
 * Check backend services and warn if not running.
 * Does NOT block - just warns and continues.
 */
const checkBackendAndWarn = (): Effect.Effect<void> =>
  Effect.gen(function* () {
    const report = yield* checkAllServicesHealth()

    const infraDown =
      report.infrastructure.postgres !== 'running' ||
      report.infrastructure.redis !== 'running'
    const servicesDown = report.summary.stopped > 0

    if (infraDown || servicesDown) {
      console.log('')
      logWithPrefix('mobile', 'WARNING: Backend services not fully running')
      console.log('')
      logWithPrefix('mobile', 'Infrastructure:')
      logWithPrefix('mobile', `  Postgres: ${report.infrastructure.postgres}`)
      logWithPrefix('mobile', `  Redis: ${report.infrastructure.redis}`)
      console.log('')
      logWithPrefix('mobile', 'Services:')
      for (const service of report.services) {
        const icon = service.status === 'running' ? '[OK]' : '[--]'
        logWithPrefix(
          'mobile',
          `  ${icon} ${service.displayName}: ${service.status}`
        )
      }
      console.log('')
      logWithPrefix(
        'mobile',
        'Run "yarn dev:backend" in another terminal to start backend'
      )
      console.log('')
    } else {
      logSuccess('mobile', 'Backend services running')
    }
  }).pipe(
    // Don't fail if health check fails - just skip warning
    Effect.catchAll(() => Effect.void)
  )

/**
 * Resolve device value from CLI options.
 *
 * - undefined: no device specified (use simulator/emulator)
 * - true: -d flag used without value, trigger interactive selection
 * - string: explicit device ID provided
 *
 * @returns Effect resolving to device ID string or undefined
 */
const resolveDevice = (
  options: MobileOptions
): Effect.Effect<string | undefined, StartupError> => {
  if (options.device === undefined) {
    // No -d flag used
    return Effect.succeed(undefined)
  }

  if (typeof options.device === 'boolean') {
    // -d flag used without value - interactive selection
    logWithPrefix('mobile', 'Selecting device interactively...')
    return selectDeviceInteractively(options.platform)
  }

  // Explicit device ID provided (string)
  return Effect.succeed(options.device)
}

/**
 * Determine host address based on platform and device flag.
 * - No device: ios -> localhost, android -> 10.0.2.2
 * - Device specified: auto-detect LAN IP (or use --host override)
 */
const determineHost = (
  platform: 'ios' | 'android',
  device: string | undefined,
  hostOverride: string | undefined
): Effect.Effect<string, LanIpDetectionError> => {
  if (device) {
    // Physical device - need LAN IP
    return detectLanIpWithPrompt(hostOverride)
  }
  // Simulator/emulator - use appropriate address
  return Effect.succeed(platform === 'ios' ? 'localhost' : '10.0.2.2')
}

/**
 * Main mobile command execution.
 */
const runMobile = (options: MobileOptions): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    console.log('')
    logWithPrefix('mobile', 'Vexl Mobile Dev')
    logWithPrefix('mobile', '='.repeat(40))
    console.log('')

    // Step 1: Check backend services (warn but don't block)
    logWithPrefix('mobile', 'Checking backend services...')
    yield* checkBackendAndWarn()
    console.log('')

    // Step 2: Resolve device (interactive selection if -d without value)
    const device = yield* resolveDevice(options)

    // Step 3: Find available Metro port
    logWithPrefix('mobile', 'Finding available Metro port...')
    const port = yield* findAvailableMetroPort()
    logWithPrefix('mobile', `Metro will run on port ${port}`)

    // Step 4: Determine host address
    logWithPrefix('mobile', 'Determining host address...')
    const host = yield* determineHost(options.platform, device, options.host)
    logWithPrefix('mobile', `Host: ${host}`)
    console.log('')

    // Step 5: Build config and start Expo
    const buildMode = getBuildMode(options)
    const config: MobileCommandConfig = {
      platform: options.platform,
      buildMode,
      device,
      port,
      host,
    }

    logWithPrefix('mobile', 'Starting Expo...')
    console.log('')

    const expoProcess: ChildProcess = yield* startExpoWithMode(config)

    // Handle process termination
    yield* Effect.async<never, Error>((resume) => {
      expoProcess.on('close', (code) => {
        if (code === 0) {
          resume(Effect.succeed(undefined as never))
        } else {
          resume(Effect.fail(new Error(`Expo exited with code ${code}`)))
        }
      })

      // Handle signals
      const cleanup = (): void => {
        expoProcess.kill('SIGTERM')
      }
      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
    })
  })

/**
 * Check if error has a specific _tag value.
 */
const isTaggedError = (error: unknown, tag: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  '_tag' in error &&
  error._tag === tag

/**
 * Check if error is a startup error with remediation.
 */
const isStartupError = (error: unknown): error is StartupError =>
  isTaggedError(error, 'MetroPortExhaustedError') ||
  isTaggedError(error, 'LanIpDetectionError') ||
  isTaggedError(error, 'ExpoStartupError')

/**
 * Handle errors with appropriate exit codes.
 */
const handleError = (error: unknown): number => {
  if (isStartupError(error)) {
    console.error('')
    console.error(formatStartupError(error))
    console.error('')
    return 1
  }

  // Generic error
  const message = error instanceof Error ? error.message : String(error)
  logError('mobile', `Failed: ${message}`)
  return 1
}

// Commander.js CLI setup
const program = new Command()

program
  .name('dev-mobile')
  .description('Start Expo dev server for mobile development')
  .version('1.0.0')
  .requiredOption(
    '-p, --platform <platform>',
    'Target platform (ios or android)'
  )
  .option('--prebuild', 'Run expo prebuild --clean before native build')
  .option('--build', 'Run native build directly (expo run:ios|android)')
  .option(
    '-d, --device [device]',
    'Target device (without value: interactive selection, with value: use that device ID)'
  )
  .option('--host <ip>', 'Override auto-detected LAN IP')
  .action((options: MobileOptions) => {
    // Validate platform
    if (options.platform !== 'ios' && options.platform !== 'android') {
      console.error('Error: --platform must be "ios" or "android"')
      process.exit(1)
    }

    NodeRuntime.runMain(
      runMobile(options).pipe(
        Effect.catchAllCause((cause) => {
          const failure = Cause.failureOption(cause)
          if (failure._tag === 'Some') {
            const exitCode = handleError(failure.value)
            return Effect.sync(() => process.exit(exitCode))
          }
          return Effect.sync(() => process.exit(1))
        })
      )
    )
  })

program.parse()
