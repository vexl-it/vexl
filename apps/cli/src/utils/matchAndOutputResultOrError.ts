import * as TE from 'fp-ts/TaskEither'
import {fd3isOpen, logError, logOutput} from './logging'
import {inspect} from 'util'

const matchAndOutputResultOrError = TE.match(
  (e: any) => {
    logError(`There was an error running the command`, e)

    if (e.error) {
      logError(inspect(e.error, {depth: 5}))
    }

    process.exit(1)
  },
  (r) => {
    logOutput(r)
    if (fd3isOpen) console.log('Only results written to descriptor 3.')
    process.exit(0)
  }
)
export default matchAndOutputResultOrError
