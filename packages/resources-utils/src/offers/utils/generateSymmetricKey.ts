import {SymmetricKey} from '@vexl-next/domain/dist/general/offers'
import crypto from 'node:crypto'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'
import * as E from 'fp-ts/Either'

export type ErrorGeneratingSymmetricKey =
  BasicError<'GeneratingSymmetricKeyError'>
export default function generateSymmetricKey(): E.Either<
  ErrorGeneratingSymmetricKey,
  SymmetricKey
> {
  return E.tryCatch(
    () => SymmetricKey.parse(crypto.randomBytes(32).toString('base64')),
    toError('GeneratingSymmetricKeyError')
  )
}
