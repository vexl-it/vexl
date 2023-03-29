import {PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {z} from 'zod'
import * as E from 'fp-ts/Either'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {pipe} from 'fp-ts/function'
import {parseJson, safeParse} from './parsing'
import {readFile} from './fs'

export const UserCredentials = z.object({
  hash: z.string(),
  signature: z.string(),
  keypair: PrivateKeyHolder,
})

export type UserCredentials = z.TypeOf<typeof UserCredentials>

interface ParsingAuthFileError {
  type: 'ParsingAuthFileError'
  error: unknown
}
export function parseAuthFile(
  filePath: PathString
): E.Either<ParsingAuthFileError, UserCredentials> {
  return pipe(
    readFile(filePath),
    E.chainW(parseJson),
    E.chainW(safeParse(UserCredentials)),
    E.mapLeft((error) => ({type: 'ParsingAuthFileError', error} as const))
  )
}
