import {
  type OfferPrivatePart,
  type OwnershipInfo,
} from '@vexl-next/domain/src/general/offers'
import {Effect, Schema} from 'effect'

export class UnknownConnectionLevelError extends Schema.TaggedError<UnknownConnectionLevelError>(
  'UnknownConnectionLevelError'
)('UnknownConnectionLevelError', {
  message: Schema.String,
}) {}

export class NoAdminIdError extends Schema.TaggedError<NoAdminIdError>(
  'NoAdminIdError'
)('NoAdminIdError', {
  message: Schema.String,
}) {}

export default function extractOwnerInfoFromOwnerPrivatePayload(
  privatePart: OfferPrivatePart
): Effect.Effect<OwnershipInfo, UnknownConnectionLevelError | NoAdminIdError> {
  return Effect.gen(function* (_) {
    const intendedConnectionLevel = yield* _(
      Effect.fromNullable(privatePart.intendedConnectionLevel),
      Effect.mapError(
        () =>
          new UnknownConnectionLevelError({
            message: 'IntendedConnection is not defined',
          })
      )
    )

    const adminId = yield* _(
      Effect.fromNullable(privatePart.adminId),
      Effect.mapError(
        () => new NoAdminIdError({message: 'AdminId is not defined'})
      )
    )

    return {
      adminId,
      intendedConnectionLevel,
    } satisfies OwnershipInfo
  })
}
