import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type FriendLevel,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option} from 'effect'

export function offerWithoutSourceOrNone(
  offer: OneOfferInState,
  {
    removedFromClubs = [],
    removedFromContacts = false,
    removedFromNearby = false,
  }: {
    removedFromClubs?: readonly ClubUuid[]
    removedFromContacts?: boolean
    removedFromNearby?: boolean
  }
): Option.Option<OneOfferInState> {
  const remainingClubIds = Array.difference(
    offer.offerInfo.privatePart.clubIds,
    removedFromClubs
  )
  const isFriendLevelRemoved: Record<FriendLevel, boolean> = {
    CLUB: Array.isEmptyArray(remainingClubIds),
    FIRST_DEGREE: removedFromContacts,
    SECOND_DEGREE: removedFromContacts,
    NEARBY: removedFromNearby,
    NOT_SPECIFIED: false,
  }
  const remainingFriendLevels = Array.filter(
    offer.offerInfo.privatePart.friendLevel,
    (friendLevel) => !isFriendLevelRemoved[friendLevel]
  )

  if (Array.isEmptyArray(remainingFriendLevels) && !offer.ownershipInfo)
    return Option.none()

  return Option.some({
    ...offer,
    offerInfo: {
      ...offer.offerInfo,
      privatePart: {
        ...offer.offerInfo.privatePart,
        clubIds: remainingClubIds,
        friendLevel: remainingFriendLevels,
      },
    },
  } satisfies OneOfferInState)
}
