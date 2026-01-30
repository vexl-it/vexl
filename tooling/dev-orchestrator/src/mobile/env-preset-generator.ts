import {Array as A, Effect, pipe} from 'effect'
import {internalIpV4} from 'internal-ip'
import {SERVICES} from '../config/services.js'
import {LanIpDetectionError} from '../errors/startup-errors.js'

/**
 * Mobile platform types for determining the correct host address.
 *
 * - 'android-emulator': Uses 10.0.2.2 (Android's alias for host machine localhost)
 * - 'ios-simulator': Uses localhost (simulator shares host network)
 * - 'physical-device': Uses detected LAN IP for network connectivity
 */
export type MobilePlatform =
  | 'android-emulator'
  | 'ios-simulator'
  | 'physical-device'

/**
 * Mapping from service name to EnvPreset field name.
 * EnvPreset is defined in @vexl-next/rest-api.
 */
const SERVICE_TO_PRESET_FIELD: Record<string, string> = {
  'user-service': 'userMs',
  'contact-service': 'contactMs',
  'offer-service': 'offerMs',
  'chat-service': 'chatMs',
  'location-service': 'locationMs',
  'notification-service': 'notificationMs',
  'btc-exchange-rate-service': 'btcExchangeRateMs',
  'feedback-service': 'feedbackMs',
  'content-service': 'contentMs',
  'metrics-service': 'metrics',
}

/**
 * Get the appropriate host address for a given mobile platform.
 *
 * - Android emulator: 10.0.2.2 (special alias that routes to host's localhost)
 * - iOS simulator: localhost (shares network stack with host)
 * - Physical device: LAN IP of the development machine
 *
 * @param platform - The target mobile platform
 * @returns Effect that resolves to host address string or fails with LanIpDetectionError
 */
export const getHostForPlatform = (
  platform: MobilePlatform
): Effect.Effect<string, LanIpDetectionError> => {
  switch (platform) {
    case 'android-emulator':
      return Effect.succeed('10.0.2.2')
    case 'ios-simulator':
      return Effect.succeed('localhost')
    case 'physical-device':
      return pipe(
        Effect.tryPromise({
          try: async () => await internalIpV4(),
          catch: (error) =>
            LanIpDetectionError.make(
              error instanceof Error ? error.message : 'Unknown error'
            ),
        }),
        Effect.flatMap((ip) =>
          ip !== undefined
            ? Effect.succeed(ip)
            : Effect.fail(
                LanIpDetectionError.make(
                  'No LAN IP address found - device may not be connected to a network'
                )
              )
        )
      )
  }
}

/**
 * Generate a local EnvPreset for the mobile app to connect to local services.
 *
 * Creates URL mappings for all 10 backend services using the appropriate host
 * address for the target platform. URLs follow the pattern: http://{host}:{port}
 *
 * Note: Returns a plain Record<string, string> rather than the typed EnvPreset
 * from rest-api package to avoid circular dependencies. The consumer can decode
 * this into EnvPreset using Schema.decodeUnknown if type safety is needed.
 *
 * @param platform - The target mobile platform
 * @returns Effect that resolves to preset object with service URLs
 */
export const generateLocalEnvPreset = (
  platform: MobilePlatform
): Effect.Effect<Record<string, string>, LanIpDetectionError> =>
  pipe(
    getHostForPlatform(platform),
    Effect.map((host) =>
      pipe(
        SERVICES,
        A.map((service) => {
          const presetField = SERVICE_TO_PRESET_FIELD[service.name]
          if (presetField === undefined) {
            // This should never happen if SERVICE_TO_PRESET_FIELD is kept in sync with SERVICES
            throw new Error(
              `No preset field mapping for service: ${service.name}`
            )
          }
          return [presetField, `http://${host}:${service.port}`] as const
        }),
        (entries) => Object.fromEntries(entries)
      )
    )
  )
