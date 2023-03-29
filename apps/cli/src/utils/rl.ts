import readline from 'node:readline/promises'
import {stdin as input, stdout as output} from 'node:process'
import * as TE from 'fp-ts/TaskEither'
import {
  type BasicError,
  toBasicError,
} from '@vexl-next/domain/dist/utility/errors'

const readlineInterface = readline.createInterface({input, output})

type ReadlineError = BasicError<'ReadlineError'>
export default function rl(
  question: string
): TE.TaskEither<ReadlineError, string> {
  return TE.tryCatch(async () => {
    return await readlineInterface.question(question)
  }, toBasicError('ReadlineError'))
}
