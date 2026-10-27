import {Schema} from 'effect'
import {existsSync, realpathSync} from 'node:fs'
import {basename, dirname, resolve} from 'node:path'
import {DatabaseSync, type SQLOutputValue} from 'node:sqlite'
import {fail} from './errors.ts'

const schema = `
  CREATE TABLE IF NOT EXISTS recipients (
    user_id TEXT PRIMARY KEY NOT NULL,
    expo_token TEXT UNIQUE NOT NULL,
    imported_at TEXT NOT NULL,
    attempted_at TEXT,
    title TEXT,
    body TEXT,
    send_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (send_status IN ('pending', 'unknown', 'accepted', 'error')),
    send_response_json TEXT,
    receipt_id TEXT,
    receipt_status TEXT CHECK (receipt_status IN ('missing', 'ok', 'error', 'lookup_failed')),
    receipt_response_json TEXT,
    receipt_checked_at TEXT,
    CHECK ((attempted_at IS NULL AND send_status = 'pending')
      OR (attempted_at IS NOT NULL AND send_status <> 'pending'))
  ) STRICT;
  CREATE INDEX IF NOT EXISTS recipients_pending ON recipients(user_id)
    WHERE attempted_at IS NULL;
  CREATE INDEX IF NOT EXISTS recipients_receipts ON recipients(user_id)
    WHERE receipt_id IS NOT NULL AND (receipt_status IS NULL OR receipt_status NOT IN ('ok', 'error'));
`

export function transaction<T>(db: DatabaseSync, operation: () => T): T {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = operation()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export async function withDatabase<T>(
  filename: string,
  mode: 'import' | 'write' | 'read',
  operation: (db: DatabaseSync) => T | Promise<T>
): Promise<T> {
  const absolute = resolve(filename)
  if (mode !== 'import' && !existsSync(absolute)) {
    fail('Database does not exist. Import the CSV first or check --db.')
  }
  const path = existsSync(absolute)
    ? realpathSync(absolute)
    : resolve(realpathSync(dirname(absolute)), basename(absolute))
  let lock: DatabaseSync | undefined
  let db: DatabaseSync | undefined
  try {
    if (mode !== 'read') {
      // The OS releases this separate database lock even when the process is killed.
      lock = new DatabaseSync(`${path}.lock.sqlite`)
      try {
        lock.exec('PRAGMA busy_timeout = 0; BEGIN EXCLUSIVE')
      } catch {
        fail('Another command is using this database. Wait for it to finish.')
      }
    }
    db = new DatabaseSync(path, {readOnly: mode === 'read'})
    if (mode !== 'read') {
      db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL')
      if (mode === 'import') db.exec(schema)
    }
    return await operation(db)
  } finally {
    try {
      db?.close()
    } finally {
      lock?.close()
    }
  }
}

const Count = Schema.Struct({count: Schema.Number})

export function countRecipients(db: DatabaseSync, pending = false): number {
  return Schema.decodeUnknownSync(Count)(
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM recipients ${pending ? 'WHERE attempted_at IS NULL' : ''}`
      )
      .get()
  ).count
}

export function status(
  db: DatabaseSync
): Record<string, number | Array<Record<string, SQLOutputValue>>> {
  return {
    total: countRecipients(db),
    sends: db
      .prepare(
        'SELECT send_status, COUNT(*) AS count FROM recipients GROUP BY send_status'
      )
      .all(),
    receipts: db
      .prepare(
        `SELECT COALESCE(receipt_status, 'pending') AS receipt_status,
        COUNT(*) AS count FROM recipients WHERE receipt_id IS NOT NULL GROUP BY receipt_status`
      )
      .all(),
    unresolvedReceiptsOlderThan24Hours: Schema.decodeUnknownSync(Count)(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM recipients WHERE receipt_id IS NOT NULL
          AND (receipt_status IS NULL OR receipt_status NOT IN ('ok', 'error'))
          AND attempted_at < ?`
        )
        .get(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ).count,
  }
}
