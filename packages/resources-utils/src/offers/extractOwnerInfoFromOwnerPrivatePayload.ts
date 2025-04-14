import {
  type OfferPrivatePart,
  type OwnershipInfo,
} from '@vexl-next/domain/src/general/offers'
import {Option} from 'effect'

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
