import {Expo} from 'expo-server-sdk'
import {parseArgs} from 'node:util'
import {status, withDatabase} from './database.ts'
import {CliError, fail} from './errors.ts'
import {importCsv} from './import.ts'
import {preview, receipts, send, validateSend} from './notifications.ts'

const help = `Usage: pnpm notify <command> [options]

  import   --csv users.csv [--db notifications.sqlite]
  send     --title "Title" --body "Body" --chunk-size 100 [--dry-run] [--db ...]
  receipts [--db ...]
  status   [--db ...]

Set EXPO_ACCESS_TOKEN for send and receipts. Dry runs need no token.
Import requires CSV headers id,expo_token and an empty recipients table.
All attempted records, including unknown outcomes and errors, stay excluded.
Receipt lookups make one pass; run again later for missing receipts.
`

async function main(): Promise<void> {
  process.umask(0o077)
  const {values, positionals} = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
      db: {type: 'string', default: 'notifications.sqlite'},
      csv: {type: 'string'},
      title: {type: 'string'},
      body: {type: 'string'},
      'chunk-size': {type: 'string'},
      'dry-run': {type: 'boolean'},
      help: {type: 'boolean', short: 'h'},
    },
  })
  if (values.help || positionals.length === 0) {
    console.log(help)
    return
  }
  if (positionals.length !== 1) fail('Specify exactly one command. Use --help.')
  const command = positionals[0]
  if (values['dry-run'] && command !== 'send')
    fail('--dry-run is only supported for send.')
  if (command === 'import') {
    if (!values.csv) fail('Import requires --csv.')
    const filename = values.csv
    const imported = await withDatabase(
      values.db,
      'import',
      async (db) => await importCsv(db, filename)
    )
    console.log(JSON.stringify({imported}, null, 2))
  } else if (command === 'status') {
    console.log(
      JSON.stringify(await withDatabase(values.db, 'read', status), null, 2)
    )
  } else if (command === 'send' || command === 'receipts') {
    const options = {
      title: values.title ?? '',
      body: values.body ?? '',
      chunkSize: Number(values['chunk-size']),
    }
    if (command === 'send') validateSend(options)
    if (values['dry-run']) {
      console.log(
        JSON.stringify(
          await withDatabase(values.db, 'read', (db) => preview(db, options)),
          null,
          2
        )
      )
      return
    }
    const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim()
    if (!accessToken)
      fail('Set EXPO_ACCESS_TOKEN before sending or fetching receipts.')
    const expo = new Expo({accessToken, maxConcurrentRequests: 1})
    const result =
      command === 'send'
        ? await withDatabase(
            values.db,
            'write',
            async (db) => await send(db, expo, accessToken, options)
          )
        : await withDatabase(
            values.db,
            'write',
            async (db) => await receipts(db, expo, accessToken)
          )
    console.log(JSON.stringify(result, null, 2))
  } else {
    fail('Unknown command. Use --help.')
  }
}

try {
  await main()
} catch (error) {
  console.error(
    error instanceof CliError
      ? error.message
      : 'Command failed. Check arguments, database access, and schema. No recipient data is printed. Use --help for usage.'
  )
  process.exitCode = 1
}
