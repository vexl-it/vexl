/**
 * Loads the optional, gitignored root `.env.local`.
 *
 * `.env.local` is for OPTIONAL feature secrets only (see example.env.local).
 * The core stack runs without any of them. To keep a stale or legacy `.env.local`
 * (e.g. one left over from the old orchestrator with a global `DB_URL`,
 * `DB_PASSWORD`, `REDIS_URL`, …) from clobbering the per-service connection
 * config computed in dev.config.ts, ONLY the allow-listed optional-secret keys
 * below are injected into spawned processes. Everything else in `.env.local` is
 * ignored for env injection.
 *
 * Port overrides are handled separately: `resolvePorts` reads the RAW file but
 * only ever looks up `<SCREAMING_SNAKE>_PORT` keys, so feeding it the raw env is
 * safe and keeps the documented machine-specific port override working.
 *
 * We deliberately do NOT mutate `process.env`; the supervisor controls merge
 * order explicitly.
 */
import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

export type Secrets = Record<string, string>

export const repoRoot = join(__dirname, '..', '..')

/**
 * Allow-list of keys that `.env.local` may inject into spawned processes.
 * KEEP IN SYNC with example.env.local. Intentionally excludes all structural
 * keys (DB_URL/DB_*, REDIS_*, ports, crypto, SERVICE_*) — those are owned by
 * dev.config.ts and must never be overridden by a leftover `.env.local`.
 */
export const OPTIONAL_SECRET_KEYS: ReadonlySet<string> = new Set([
  'PRELUDE_API_TOKEN',
  'TURNSTILE_SECRET_KEY',
  'TURNSTILE_EXPECTED_HOSTNAME',
  'EXPO_ACCESS_TOKEN',
  'FCM_TOKEN_PUBLIC_KEY',
  'FCM_TOKEN_PRIVATE_KEY',
  'GOOGLE_PLACES_API_KEY',
  'WEBFLOW_TOKEN',
  'WEBFLOW_EVENTS_COLLECTION_ID',
  'WEBFLOW_SPEAKERS_COLLECTION_ID',
  'WEBFLOW_BLOG_COLLECTION_ID',
  'BTC_PAY_SERVER_URL',
  'BTC_PAY_SERVER_API_KEY',
  'BTC_PAY_SERVER_STORE_ID',
  'BTC_PAY_SERVER_WEBHOOK_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
])

function parseEnvContent(raw: string): Record<string, string> {
  const result: Record<string, string> = {}

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    if (key.length === 0) continue

    let value = trimmed.slice(eq + 1).trim()
    // Strip a single matching pair of surrounding quotes.
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }

  return result
}

/** Raw parse of every key in `.env.local` (used only for port resolution). */
export function loadRawEnvLocal(): Record<string, string> {
  const path = join(repoRoot, '.env.local')
  if (!existsSync(path)) return {}
  return parseEnvContent(readFileSync(path, 'utf8'))
}

/**
 * Optional secrets to inject into spawned processes: only allow-listed keys
 * with a NON-EMPTY value. An empty value (e.g. a freshly copied template) does
 * NOT override the non-secret default from dev.config.ts.
 */
export function loadSecrets(): Secrets {
  const raw = loadRawEnvLocal()
  const result: Secrets = {}
  for (const [key, value] of Object.entries(raw)) {
    if (OPTIONAL_SECRET_KEYS.has(key) && value.length > 0) {
      result[key] = value
    }
  }
  return result
}
