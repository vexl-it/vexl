import {parse} from 'csv-parse'
import {Either, Schema} from 'effect'
import {Expo} from 'expo-server-sdk'
import {createReadStream} from 'node:fs'
import {type DatabaseSync} from 'node:sqlite'
import {pipeline} from 'node:stream'
import {countRecipients} from './database.ts'
import {CliError, fail} from './errors.ts'

const CsvRow = Schema.Struct({
  id: Schema.NonEmptyTrimmedString,
  expo_token: Schema.NonEmptyTrimmedString.pipe(
    Schema.filter(
      (token) => Expo.isExpoPushToken(token) && !/\s|\[\]/.test(token)
    )
  ),
})

export async function importCsv(
  db: DatabaseSync,
  filename: string
): Promise<number> {
  if (countRecipients(db) !== 0)
    fail('Import requires an empty recipients table.')
  const parser = parse({
    bom: true,
    columns: (headers: string[]) => {
      if (
        headers.length !== 2 ||
        !headers.includes('id') ||
        !headers.includes('expo_token')
      ) {
        fail('CSV headers must be exactly id and expo_token.')
      }
      return headers
    },
    skip_empty_lines: true,
    trim: true,
    max_record_size: 1024 * 1024,
  })
  let count = 0
  const importedAt = new Date().toISOString()
  const conflict = db.prepare(
    'SELECT 1 FROM recipients WHERE user_id = ? OR expo_token = ?'
  )
  const insert = db.prepare(
    'INSERT INTO recipients (user_id, expo_token, imported_at) VALUES (?, ?, ?)'
  )
  db.exec('BEGIN IMMEDIATE')
  try {
    pipeline(createReadStream(filename), parser, () => {})
    for await (const raw of parser) {
      const decoded = Schema.decodeUnknownEither(CsvRow)(raw)
      if (Either.isLeft(decoded))
        fail(`Invalid ID or Expo token at CSV record ${count + 1}.`)
      const row = decoded.right
      if (conflict.get(row.id, row.expo_token)) {
        fail(
          `Duplicate ID or Expo token at CSV record ${count + 1}. Import rolled back.`
        )
      }
      insert.run(row.id, row.expo_token, importedAt)
      count++
    }
    if (count === 0) fail('CSV contains no recipients.')
    db.exec('COMMIT')
    return count
  } catch (error) {
    db.exec('ROLLBACK')
    if (error instanceof CliError) throw error
    fail(
      `Could not import CSV near record ${count + 1}. Check file access and CSV syntax. Import rolled back.`
    )
  } finally {
    parser.destroy()
  }
}
