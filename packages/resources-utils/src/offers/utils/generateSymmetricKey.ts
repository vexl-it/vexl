import {SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {Effect, Schema} from 'effect'
import crypto from 'node:crypto'

export class SymmetricKeyGenerationError extends Schema.TaggedError<SymmetricKeyGenerationError>(
  'SymmetricKeyGenerationError'
)('SymmetricKeyGenerationError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export default function generateSymmetricKey(): Effect.Effect<
  SymmetricKey,
  SymmetricKeyGenerationError
> {
  return Effect.try({
    try: () => SymmetricKey.parse(crypto.randomBytes(32).toString('base64')),
    catch: (e) =>
      new SymmetricKeyGenerationError({
        cause: e,
        message: 'Error generating symmetric key',
      }),
  })
}
