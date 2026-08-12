import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {Effect} from 'effect'

/**
 * Provisions a throwaway per-test-file database via the shared server-utils
 * helper (which exports it as DB_URL/DB_USER/DB_PASSWORD) and mirrors it into
 * the GEOCODING_DB_* vars the geocoding DB layer reads.
 */
export const setupGeocodingTestDatabase = setupTestDatabase.pipe(
  Effect.tap(() =>
    Effect.sync(() => {
      process.env.GEOCODING_DB_URL = process.env.DB_URL
      process.env.GEOCODING_DB_USER = process.env.DB_USER
      process.env.GEOCODING_DB_PASSWORD = process.env.DB_PASSWORD
    })
  )
)

export const disposeGeocodingTestDatabase = disposeTestDatabase
