import {runMain} from '@effect/platform-node/NodeRuntime'
import {Effect, Logger} from 'effect/index'
import {getResultsCsv, getResultsJson} from '.'

const clearLoggerLayer = Logger.replace(
  Logger.defaultLogger,
  Logger.make(({message}) => {
    globalThis.console.log(Array.isArray(message) ? message.join() : message)
  })
)

// If the file is run with --output=json
if (process.argv.includes('--output=json')) {
  runMain(getResultsJson.pipe(Effect.provide(clearLoggerLayer)), {
    disablePrettyLogger: true,
  })
} else if (process.argv.includes('--output=csv')) {
  runMain(getResultsCsv.pipe(Effect.provide(clearLoggerLayer)), {
    disablePrettyLogger: true,
  })
} else {
  console.error(
    'Please specify output format with --output=json or --output=csv'
  )
}
