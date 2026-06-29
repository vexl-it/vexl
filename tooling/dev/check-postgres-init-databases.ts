import {Array, Order, pipe} from 'effect'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {allDatabaseNames} from './services'

const initScriptPath = join(
  __dirname,
  'postgres-init',
  '01-create-databases.sh'
)

const initScript = readFileSync(initScriptPath, 'utf8')
const databasesAssignment = initScript.match(/^DATABASES="([^"]*)"$/m)

if (databasesAssignment === null) {
  throw new Error(
    'Could not find DATABASES assignment in Postgres init script.'
  )
}

const configured = pipe(allDatabaseNames(), Array.sort(Order.string))
const scripted = pipe(
  databasesAssignment[1].split(' '),
  Array.filter((databaseName) => databaseName.length > 0),
  Array.sort(Order.string)
)

if (configured.join('\n') !== scripted.join('\n')) {
  throw new Error(
    [
      'Postgres init databases do not match dev.config.ts dbNames.',
      `Configured: ${configured.join(', ')}`,
      `Script: ${scripted.join(', ')}`,
    ].join('\n')
  )
}
