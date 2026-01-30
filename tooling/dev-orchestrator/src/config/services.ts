import {Array as A, Option} from 'effect'

export interface ServiceConfig {
  readonly name: string
  readonly displayName: string
  readonly workspaceName: string
  readonly port: number
  readonly healthPort: number
  readonly tier: number // 0 = no deps, 1 = depends on tier 0, etc.
  readonly needsDatabase: boolean
}

/**
 * All backend services with hardcoded dependency ordering.
 * Per CONTEXT.md: dependencies are hardcoded, not inferred from code.
 *
 * Tier 0: No dependencies - start first
 * Tier 1: May depend on tier 0 services
 * Tier 2: May depend on tier 1 services
 */
export const SERVICES: readonly ServiceConfig[] = [
  // Tier 0: No dependencies - start first
  {
    name: 'user-service',
    displayName: 'User Service',
    workspaceName: '@vexl-next/user-service',
    port: 3001,
    healthPort: 8001,
    tier: 0,
    needsDatabase: true,
  },
  {
    name: 'btc-exchange-rate-service',
    displayName: 'BTC Exchange',
    workspaceName: '@vexl-next/btc-exchange-rate-service',
    port: 3007,
    healthPort: 8007,
    tier: 0,
    needsDatabase: false, // Uses external APIs only
  },
  {
    name: 'metrics-service',
    displayName: 'Metrics',
    workspaceName: '@vexl-next/metrics-service',
    port: 3010,
    healthPort: 8010,
    tier: 0,
    needsDatabase: true,
  },

  // Tier 1: Depends on Tier 0 services (or no deps but logically after tier 0)
  {
    name: 'contact-service',
    displayName: 'Contact Service',
    workspaceName: '@vexl-next/contact-service',
    port: 3002,
    healthPort: 8002,
    tier: 1,
    needsDatabase: true,
  },
  {
    name: 'notification-service',
    displayName: 'Notification',
    workspaceName: '@vexl-next/notification-service',
    port: 3006,
    healthPort: 8006,
    tier: 1,
    needsDatabase: true,
  },
  {
    name: 'feedback-service',
    displayName: 'Feedback',
    workspaceName: '@vexl-next/feedback-service',
    port: 3008,
    healthPort: 8008,
    tier: 1,
    needsDatabase: true,
  },
  {
    name: 'content-service',
    displayName: 'Content',
    workspaceName: '@vexl-next/content-service',
    port: 3009,
    healthPort: 8009,
    tier: 1,
    needsDatabase: false, // Uses Webflow CMS
  },
  {
    name: 'location-service',
    displayName: 'Location',
    workspaceName: '@vexl-next/location-service',
    port: 3005,
    healthPort: 8005,
    tier: 1,
    needsDatabase: false, // Uses Google Places API
  },

  // Tier 2: Depends on Tier 1 services
  {
    name: 'offer-service',
    displayName: 'Offer Service',
    workspaceName: '@vexl-next/offer-service',
    port: 3003,
    healthPort: 8003,
    tier: 2,
    needsDatabase: true,
  },
  {
    name: 'chat-service',
    displayName: 'Chat Service',
    workspaceName: '@vexl-next/chat-service',
    port: 3004,
    healthPort: 8004,
    tier: 2,
    needsDatabase: true,
  },
]

/**
 * Get services grouped by tier for ordered startup.
 * Returns array of arrays: [[tier0 services], [tier1 services], [tier2 services]]
 */
export const getServicesByTier = (): ReadonlyArray<
  readonly ServiceConfig[]
> => {
  const grouped = A.groupBy(SERVICES, (s) => String(s.tier))
  const tiers = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))
  return A.map(tiers, (tier) => grouped[tier] ?? [])
}

/**
 * Get a service by name
 */
export const getServiceByName = (name: string): ServiceConfig | undefined => {
  const result = A.findFirst(SERVICES, (s) => s.name === name)
  return Option.isSome(result) ? result.value : undefined
}

/**
 * Get database names for services that need databases.
 * Database naming convention: vexl_{service_name} with hyphens replaced by underscores.
 */
export const getDatabaseNames = (): readonly string[] =>
  A.filterMap(SERVICES, (s) =>
    s.needsDatabase
      ? Option.some(`vexl_${s.name.replace(/-/g, '_')}`)
      : Option.none()
  )
