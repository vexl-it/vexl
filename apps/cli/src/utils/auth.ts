import {PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {z} from 'zod'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {
  parseJson,
  safeParse,
} from '@vexl-next/resources-utils/dist/utils/parsing'
import {
  type BasicError,
  toBasicError,
} from '@vexl-next/domain/dist/utility/errors'

export const UserCredentials = z.object({
  hash: z.string(),
  signature: z.string(),
  keypair: PrivateKeyHolder,
})

export type UserCredentials = z.TypeOf<typeof UserCredentials>

export type ParsingCredentialsError = BasicError<'ParsingCredentialsError'>

export function parseCredentialsJson(
  credentialsJson: string
): E.Either<ParsingCredentialsError, UserCredentials> {
  return pipe(
    credentialsJson,
    parseJson,
    E.chainW(safeParse(UserCredentials)),
    E.mapLeft(toBasicError('ParsingCredentialsError'))
  )
}
