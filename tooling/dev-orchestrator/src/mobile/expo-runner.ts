import {Effect} from 'effect'
import type {ChildProcess} from 'node:child_process'
import {spawn} from 'node:child_process'
import {readdir, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import type {MobileConfig} from '../config/dev-config-schema.js'
import {findProjectRoot} from '../config/env-loader.js'
import {
  ExpoStartupError,
  type LanIpDetectionError,
} from '../errors/startup-errors.js'
import {logWithPrefix} from '../ui/logger.js'
import {
  generateLocalEnvPreset,
  type MobilePlatform,
} from './env-preset-generator.js'

/**
 * Default Metro bundler port for Expo.
 */
const DEFAULT_EXPO_PORT = 8081

/**
 * Build modes for Expo:
 * - 'expo-go': Metro bundler for Expo Go app (npx expo start --dev-client)
 * - 'prebuild': Run expo prebuild --clean, then expo run:ios|android
 * - 'native-build': Run expo run:ios|android directly (no prebuild)
 */
export type BuildMode = 'expo-go' | 'prebuild' | 'native-build'

/**
 * Extended mobile config for dev:mobile command.
 */
export interface MobileCommandConfig {
  platform: 'ios' | 'android'
  buildMode: BuildMode
  releaseMode: boolean
  clearCache: boolean
  staging: boolean
  device?: string
  deviceType?: 'physical' | 'emulator' | 'simulator'
  port: number
  host: string // LAN IP or localhost or 10.0.2.2
}

/**
 * Build EXPO_PUBLIC_LOCAL_* environment variables from the generated preset.
 *
 * These environment variables are read by buildLocalEnvFromEnvVars() in
 * apps/mobile/src/api/index.ts when ENV_PRESET=local.
 *
 * @param preset - Object with service URLs from generateLocalEnvPreset
 * @returns Record of EXPO_PUBLIC_LOCAL_* env vars
 */
export const buildExpoPublicEnvVars = (
  preset: Record<string, string>
): Record<string, string> => ({
  EXPO_PUBLIC_LOCAL_USER_MS: preset.userMs ?? '',
  EXPO_PUBLIC_LOCAL_CONTACT_MS: preset.contactMs ?? '',
  EXPO_PUBLIC_LOCAL_CHAT_MS: preset.chatMs ?? '',
  EXPO_PUBLIC_LOCAL_OFFER_MS: preset.offerMs ?? '',
  EXPO_PUBLIC_LOCAL_LOCATION_MS: preset.locationMs ?? '',
  EXPO_PUBLIC_LOCAL_NOTIFICATION_MS: preset.notificationMs ?? '',
  EXPO_PUBLIC_LOCAL_BTC_EXCHANGE_RATE_MS: preset.btcExchangeRateMs ?? '',
  EXPO_PUBLIC_LOCAL_FEEDBACK_MS: preset.feedbackMs ?? '',
  EXPO_PUBLIC_LOCAL_CONTENT_MS: preset.contentMs ?? '',
  EXPO_PUBLIC_LOCAL_METRICS_MS: preset.metrics ?? '',
})

/**
 * Log resolved API URLs that will be injected into the mobile app.
 */
const logResolvedApiUrls = (preset: Record<string, string>): void => {
  logWithPrefix('expo', 'Resolved local API URLs:')
  for (const [service, url] of Object.entries(preset)) {
    logWithPrefix('expo', `  ${service}: ${url}`)
  }
}

/**
 * Determine platform type for env var generation.
 *
 * @param platform - Target platform (ios or android)
 * @param deviceType - Optional selected device type
 * @returns MobilePlatform for URL generation
 */
const getPlatformType = (
  platform: 'ios' | 'android',
  deviceType?: 'physical' | 'emulator' | 'simulator'
): MobilePlatform => {
  if (deviceType === 'physical') return 'physical-device'
  if (deviceType === 'simulator') return 'ios-simulator'
  if (deviceType === 'emulator') return 'android-emulator'
  return platform === 'ios' ? 'ios-simulator' : 'android-emulator'
}

/**
 * Remove a directory silently (no error if missing).
 */
const rmDir = (path: string): Effect.Effect<boolean> =>
  Effect.tryPromise({
    try: async () => {
      await rm(path, {recursive: true, force: true})
      return true
    },
    catch: () => new Error(`Failed to remove ${path}`),
  }).pipe(Effect.catchAll(() => Effect.succeed(false)))

/**
 * Clear Metro bundler cache directories from the system temp folder.
 *
 * Metro caches transformed JS modules (including inlined EXPO_PUBLIC_* env vars)
 * independently of Gradle's build cache. Without clearing these, stale env var
 * values from previous builds can persist even when --no-build-cache is used.
 */
const clearMetroCache = (): Effect.Effect<void> =>
  Effect.gen(function* () {
    logWithPrefix('expo', 'Clearing Metro bundler cache...')

    const tmp = tmpdir()
    const noEntries: string[] = []
    const entries = yield* Effect.tryPromise({
      try: async () => await readdir(tmp),
      catch: () => new Error('Failed to read temp directory'),
    }).pipe(Effect.catchAll(() => Effect.succeed(noEntries)))

    const metroDirs = entries.filter(
      (name: string) =>
        name.startsWith('metro-') || name.startsWith('haste-map-')
    )

    let cleared = 0
    yield* Effect.forEach(
      metroDirs,
      (dir) =>
        rmDir(join(tmp, dir)).pipe(
          Effect.map((ok) => {
            if (ok) cleared++
          })
        ),
      {concurrency: 'unbounded'}
    )

    if (cleared > 0) {
      logWithPrefix(
        'expo',
        `Cleared ${String(cleared)} Metro cache director${cleared === 1 ? 'y' : 'ies'}`
      )
    } else {
      logWithPrefix('expo', 'No Metro cache found')
    }
  })

/**
 * Clean the Android Gradle build output that contains the pre-built JS bundle.
 *
 * Gradle's up-to-date check does NOT track environment variables as task inputs.
 * When EXPO_PUBLIC_* values change (e.g. switching between emulator/physical device),
 * Gradle skips re-bundling the JS because no source files changed, leaving stale
 * env var values baked into the JS bundle. Deleting the build output forces Gradle
 * to re-run the bundling task.
 */
const cleanAndroidBuildOutput = (mobileAppPath: string): Effect.Effect<void> =>
  Effect.gen(function* () {
    const buildDir = join(mobileAppPath, 'android', 'app', 'build')
    logWithPrefix('expo', 'Cleaning Android build output...')
    const removed = yield* rmDir(buildDir)
    if (removed) {
      logWithPrefix('expo', 'Android build output cleaned')
    } else {
      logWithPrefix('expo', 'No Android build output to clean')
    }
  })

/**
 * Start Expo in Expo Go mode (npx expo start --dev-client).
 */
const startExpoGoMode = (
  config: MobileCommandConfig,
  mobileAppPath: string,
  expoPublicEnvVars: Record<string, string>
): Effect.Effect<ChildProcess, ExpoStartupError> =>
  Effect.gen(function* () {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ...expoPublicEnvVars,
    }

    const args = [
      'expo',
      'start',
      '--dev-client',
      '--port',
      String(config.port),
    ]

    const childProcess = yield* Effect.try({
      try: () =>
        spawn('npx', args, {
          cwd: mobileAppPath,
          env,
          stdio: 'inherit',
          shell: true,
        }),
      catch: (error) =>
        new ExpoStartupError({
          reason: `Failed to start Expo: ${String(error)}`,
          remediation:
            'Ensure Expo CLI is installed: npx expo --version. Check apps/mobile directory exists.',
        }),
    })

    childProcess.on('error', (error) => {
      logWithPrefix('expo', `Process error: ${error.message}`)
    })

    return childProcess
  })

/**
 * Run Expo native build (expo run:ios|android).
 */
export const runNativeBuild = (
  config: MobileCommandConfig,
  mobileAppPath: string,
  expoPublicEnvVars: Record<string, string>
): Effect.Effect<ChildProcess, ExpoStartupError> =>
  Effect.gen(function* () {
    // Clear all JS bundler caches when in release mode or explicitly requested.
    // Both Metro and Gradle cache JS bundles with inlined EXPO_PUBLIC_* values.
    // Gradle's up-to-date check doesn't track env vars as inputs, so stale
    // values (e.g. wrong host IP) persist across builds without this cleanup.
    if (config.releaseMode || config.clearCache) {
      yield* clearMetroCache()
      if (config.platform === 'android') {
        yield* cleanAndroidBuildOutput(mobileAppPath)
      }
    }

    const args = [
      'expo',
      `run:${config.platform}`,
      '--port',
      String(config.port),
    ]

    // Ensure fresh native artifacts so EXPO_PUBLIC_LOCAL_* changes are always applied.
    if (config.platform === 'android') {
      args.push('--no-build-cache')
    }

    if (config.releaseMode) {
      if (config.platform === 'android') {
        args.push('--variant', 'release')
      } else {
        args.push('--configuration', 'Release')
      }
    }

    if (config.device) {
      args.push('--device', config.device)
    }

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ...expoPublicEnvVars,
    }

    const childProcess = yield* Effect.try({
      try: () =>
        spawn('npx', args, {
          cwd: mobileAppPath,
          env,
          stdio: 'inherit',
          shell: true,
        }),
      catch: (error) =>
        new ExpoStartupError({
          reason: `Failed to start native build: ${String(error)}`,
          remediation:
            'Ensure Xcode/Android SDK is configured. Run `npx expo doctor` for diagnostics.',
        }),
    })

    childProcess.on('error', (error) => {
      logWithPrefix('expo', `Process error: ${error.message}`)
    })

    return childProcess
  })

/**
 * Run Expo prebuild then native build.
 * EXPO_NO_GIT_STATUS=1 skips the uncommitted changes warning.
 */
export const runPrebuildThenNative = (
  config: MobileCommandConfig,
  mobileAppPath: string,
  expoPublicEnvVars: Record<string, string>
): Effect.Effect<ChildProcess, ExpoStartupError> =>
  Effect.gen(function* () {
    const platform = config.platform

    // Step 1: Run prebuild with EXPO_NO_GIT_STATUS=1
    logWithPrefix('expo', 'Running expo prebuild --clean...')

    yield* Effect.tryPromise({
      try: async () => {
        await new Promise<void>((resolve, reject) => {
          const prebuild = spawn(
            'npx',
            ['expo', 'prebuild', '--clean', '--platform', platform],
            {
              cwd: mobileAppPath,
              env: {
                ...process.env,
                EXPO_NO_GIT_STATUS: '1',
                ...expoPublicEnvVars,
              },
              stdio: 'inherit',
              shell: true,
            }
          )
          prebuild.on('close', (code) => {
            if (code === 0) resolve()
            else reject(new Error(`Prebuild failed with exit code ${code}`))
          })
          prebuild.on('error', reject)
        })
      },
      catch: (e) =>
        new ExpoStartupError({
          reason: `Prebuild failed: ${e instanceof Error ? e.message : String(e)}`,
          remediation: 'Check Expo prebuild output above for errors',
        }),
    })

    logWithPrefix('expo', 'Prebuild complete, starting native build...')

    // Step 2: Run native build
    return yield* runNativeBuild(config, mobileAppPath, expoPublicEnvVars)
  })

/**
 * Start Expo based on build mode.
 *
 * @param config - Mobile command configuration
 * @returns Effect that resolves to the spawned ChildProcess
 */
export const startExpoWithMode = (
  config: MobileCommandConfig
): Effect.Effect<ChildProcess, ExpoStartupError | LanIpDetectionError> =>
  Effect.gen(function* () {
    const projectRoot = findProjectRoot()
    const mobileAppPath = `${projectRoot}/apps/mobile`

    // When --staging is used, skip local env generation and use staging preset
    const expoPublicEnvVars: Record<string, string> = config.staging
      ? {ENV_PRESET: 'stage'}
      : yield* Effect.gen(function* () {
          // Determine platform type for URL generation
          const platformType = getPlatformType(
            config.platform,
            config.deviceType
          )

          // Generate local service URLs based on platform type
          // For physical devices, rewrite generated URLs to the selected LAN host.
          const preset = yield* generateLocalEnvPreset(platformType).pipe(
            Effect.map((p) => {
              if (
                config.deviceType === 'physical' &&
                config.host !== 'localhost'
              ) {
                const rewritten: Record<string, string> = {}
                for (const [key, url] of Object.entries(p)) {
                  // Replace host in URL
                  const urlObj = new URL(url)
                  urlObj.hostname = config.host
                  rewritten[key] = urlObj.toString().replace(/\/$/, '') // Remove trailing slash
                }
                return rewritten
              }
              return p
            })
          )

          logResolvedApiUrls(preset)
          return {...buildExpoPublicEnvVars(preset), ENV_PRESET: 'local'}
        })

    logWithPrefix('expo', `Platform: ${config.platform}`)
    logWithPrefix('expo', `Build mode: ${config.buildMode}`)
    logWithPrefix('expo', `Release mode: ${config.releaseMode ? 'ON' : 'OFF'}`)
    if (config.staging) {
      logWithPrefix('expo', 'Environment: STAGING')
    }
    logWithPrefix('expo', `Metro port: ${config.port}`)
    if (config.device) {
      logWithPrefix('expo', `Device: ${config.device}`)
    }
    if (config.deviceType === 'physical') {
      logWithPrefix('expo', `Host: ${config.host}`)
    }

    switch (config.buildMode) {
      case 'expo-go':
        return yield* startExpoGoMode(config, mobileAppPath, expoPublicEnvVars)

      case 'prebuild':
        return yield* runPrebuildThenNative(
          config,
          mobileAppPath,
          expoPublicEnvVars
        )

      case 'native-build':
        return yield* runNativeBuild(config, mobileAppPath, expoPublicEnvVars)
    }
  })

/**
 * Start Expo dev server with EXPO_PUBLIC_LOCAL_* environment variables.
 *
 * This function:
 * 1. Generates local service URLs based on mobile platform
 * 2. Builds EXPO_PUBLIC_LOCAL_* env vars for the mobile app
 * 3. Spawns Expo dev server with those env vars
 *
 * The spawned process is NOT tracked in RunningServices because:
 * - It's a development tool, not a backend service
 * - It has no health endpoint to check
 * - Shutdown is simpler (just kill the process)
 *
 * @deprecated Use startExpoWithMode instead. Kept for backward compatibility with unified dev command.
 * @param config - Mobile configuration from devConfig
 * @returns Effect that resolves to the spawned ChildProcess
 */
export const startExpoDevServer = (
  config: MobileConfig
): Effect.Effect<ChildProcess, ExpoStartupError | LanIpDetectionError> =>
  Effect.gen(function* () {
    const expoPort = config.expoPort ?? DEFAULT_EXPO_PORT
    const projectRoot = findProjectRoot()
    const mobileAppPath = `${projectRoot}/apps/mobile`

    // Generate local service URLs based on platform
    const preset = yield* generateLocalEnvPreset(config.platform)

    // Build EXPO_PUBLIC env vars
    const expoPublicEnvVars = buildExpoPublicEnvVars(preset)

    logWithPrefix('expo', `Platform: ${config.platform}`)
    logWithPrefix('expo', `Metro bundler port: ${expoPort}`)

    // Build full environment
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ENV_PRESET: 'local',
      ...expoPublicEnvVars,
    }

    // Build command args
    const args = ['expo', 'start', '--dev-client']
    if (expoPort !== DEFAULT_EXPO_PORT) {
      args.push('--port', String(expoPort))
    }

    // Spawn Expo process
    const childProcess = yield* Effect.try({
      try: () =>
        spawn('npx', args, {
          cwd: mobileAppPath,
          env,
          stdio: 'inherit', // Pass through to parent console
          shell: true,
        }),
      catch: (error) =>
        new ExpoStartupError({
          reason: `Failed to start Expo: ${String(error)}`,
          remediation:
            'Ensure Expo CLI is installed: npx expo --version. Check apps/mobile directory exists.',
        }),
    })

    // Handle spawn errors
    childProcess.on('error', (error) => {
      logWithPrefix('expo', `Process error: ${error.message}`)
    })

    return childProcess
  })
