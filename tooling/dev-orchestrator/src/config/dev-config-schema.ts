/**
 * Type definitions for devConfig.ts structure.
 *
 * This schema defines the configuration structure for service-specific
 * environment variables. The devConfig.ts file at project root uses
 * these types to provide type-safe environment configuration.
 */

/**
 * Common environment variables shared by all services.
 * These include infrastructure (DB, Redis), security keys, and development defaults.
 */
export interface CommonEnv {
  // Infrastructure
  readonly DB_URL: string
  readonly DB_USER: string
  readonly DB_PASSWORD: string
  readonly DB_NAME?: string
  readonly REDIS_URL: string

  // Security - crypto keys used for signing/verification
  readonly SECRET_PUBLIC_KEY: string
  readonly SECRET_PRIVATE_KEY: string
  readonly SECRET_HMAC_KEY: string
  readonly SECRET_EAS_KEY: string

  // Development settings
  readonly NODE_ENV: string
  readonly SERVICE_VERSION: string
  readonly LOG_LEVEL?: string
  readonly DISABLE_METRICS?: string
  readonly METRICS_QUEUE_NAME: string
}

/**
 * Service-specific environment variables.
 * Flexible record type to accommodate varying requirements per service.
 */
export type ServiceEnv = Record<string, string | undefined>

/**
 * Mobile app configuration for local development.
 * Controls whether Expo dev server starts and which platform to target.
 */
export interface MobileConfig {
  /** Whether to start Expo dev server after backend services are healthy */
  readonly enabled: boolean
  /** Target platform for determining service URLs (localhost vs 10.0.2.2 vs LAN IP) */
  readonly platform: 'android-emulator' | 'ios-simulator' | 'physical-device'
  /** Metro bundler port, defaults to 8081 if not specified */
  readonly expoPort?: number
}

/**
 * Complete development configuration structure.
 *
 * The `common` section is required and contains infrastructure defaults.
 * Service-specific sections are optional and keyed by camelCase service name.
 */
export interface DevConfig {
  readonly common: CommonEnv

  // Service-specific overrides (camelCase keys)
  readonly userService?: ServiceEnv
  readonly contactService?: ServiceEnv
  readonly offerService?: ServiceEnv
  readonly chatService?: ServiceEnv
  readonly locationService?: ServiceEnv
  readonly notificationService?: ServiceEnv
  readonly btcExchangeRateService?: ServiceEnv
  readonly feedbackService?: ServiceEnv
  readonly contentService?: ServiceEnv
  readonly metricsService?: ServiceEnv

  /** Mobile app configuration (optional - enables Expo dev server startup) */
  readonly mobile?: MobileConfig
}

/**
 * Convert kebab-case service name to camelCase for config key lookup.
 *
 * @example
 * toServiceKey('user-service') // 'userService'
 * toServiceKey('btc-exchange-rate-service') // 'btcExchangeRateService'
 */
export const toServiceKey = (serviceName: string): string =>
  serviceName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

/**
 * Convert kebab-case service name to SCREAMING_SNAKE_CASE for SERVICE_NAME env var.
 *
 * @example
 * toScreamingSnake('user-service') // 'USER_SERVICE'
 * toScreamingSnake('btc-exchange-rate-service') // 'BTC_EXCHANGE_RATE_SERVICE'
 */
export const toScreamingSnake = (serviceName: string): string =>
  serviceName.toUpperCase().replace(/-/g, '_')
