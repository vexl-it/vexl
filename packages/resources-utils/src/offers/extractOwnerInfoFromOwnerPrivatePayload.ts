import {
  type OfferPrivatePart,
  type OwnershipInfo,
} from '@vexl-next/domain/src/general/offers'
import {Option, Schema} from 'effect'

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
): Option.Option<OwnershipInfo> {
  return Option.all({
    intendedConnectionLevel: Option.fromNullable(
      privatePart.intendedConnectionLevel
    ),
    adminId: Option.fromNullable(privatePart.adminId),
    intendedClubs: Option.some(privatePart.intendedClubs),
  })
}
