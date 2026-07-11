import {useSyncExternalStore} from 'react'
import {type MigrationControlReadResult} from './domain'
import {
  readMigrationControlRecord,
  subscribeToMigrationControlRecord,
} from './index'

/**
 * Reactively reads the durable migration control record.
 *
 * Backed by useSyncExternalStore over the dedicated control-MMKV listener
 * (NOT Jotai — the record must be readable synchronously during the very
 * first render, before any Jotai state exists). The boot gate in App.tsx
 * uses this so entering migration mode swaps in the migration-only root and
 * a safe cancellation back to 'normal' swaps the normal root back in without
 * an app restart.
 */
export function useMigrationControlRecord(): MigrationControlReadResult {
  return useSyncExternalStore(
    subscribeToMigrationControlRecord,
    readMigrationControlRecord
  )
}
