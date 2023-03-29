import readline from 'node:readline/promises'
import {stdin as input, stdout as output} from 'node:process'
import * as TE from 'fp-ts/TaskEither'

const readlineInterface = readline.createInterface({input, output})

interface ReadlineError {
  readonly type: 'ReadlineError'
  error: unknown
}

export default function rl(
  question: string
): TE.TaskEither<ReadlineError, string> {
  return TE.tryCatch(
    async () => {
      return await readlineInterface.question(question)
    },
    (e) =>
      ({
        type: 'ReadlineError',
        error: e,
      } as const)
  )
}
