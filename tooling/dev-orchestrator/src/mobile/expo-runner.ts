import {Effect} from 'effect'
import type {ChildProcess} from 'node:child_process'
import {spawn} from 'node:child_process'
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
  device?: string
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
 * Determine platform type for env var generation.
 *
 * @param platform - Target platform (ios or android)
 * @param device - Optional device name/ID (indicates physical device)
 * @returns MobilePlatform for URL generation
 */
const getPlatformType = (
  platform: 'ios' | 'android',
  device?: string
): MobilePlatform => {
  // If device specified, assume physical device
  if (device) return 'physical-device'
  // Otherwise, simulator/emulator based on platform
  return platform === 'ios' ? 'ios-simulator' : 'android-emulator'
}

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
      ENV_PRESET: 'local',
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
    const args = [
      'expo',
      `run:${config.platform}`,
      '--port',
      String(config.port),
    ]
    if (config.device) {
      args.push('--device', config.device)
    }

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ENV_PRESET: 'local',
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
              env: {...process.env, EXPO_NO_GIT_STATUS: '1'},
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

    // Determine platform type for URL generation
    const platformType = getPlatformType(config.platform, config.device)

    // Generate local service URLs based on platform type
    // But override host if device specified (use LAN IP from config.host)
    const preset = yield* generateLocalEnvPreset(
      config.device ? 'physical-device' : platformType
    ).pipe(
      Effect.map((p) => {
        // If custom host provided (for physical device), rewrite URLs
        if (config.device && config.host !== 'localhost') {
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

    // Build EXPO_PUBLIC env vars
    const expoPublicEnvVars = buildExpoPublicEnvVars(preset)

    logWithPrefix('expo', `Platform: ${config.platform}`)
    logWithPrefix('expo', `Build mode: ${config.buildMode}`)
    logWithPrefix('expo', `Metro port: ${config.port}`)
    if (config.device) {
      logWithPrefix('expo', `Device: ${config.device}`)
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
