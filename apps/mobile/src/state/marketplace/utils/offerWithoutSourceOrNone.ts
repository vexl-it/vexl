import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type FriendLevel,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option} from 'effect'

export function offerWithoutSourceOrNone(
  offer: OneOfferInState,
  removedFromClubs: ClubUuid[],
  removedFromContacts: boolean
): Option.Option<OneOfferInState> {
  console.log('b1')
  const remainingClubIds = Array.difference(
    offer.offerInfo.privatePart.clubIds,
    removedFromClubs
  )
  console.log('b2')
  const friendLevelsToRemove: FriendLevel[] = [
    ...(Array.isEmptyArray(remainingClubIds) ? ['CLUB' as const] : []),
    ...(removedFromContacts
      ? ['FIRST_DEGREE' as const, 'SECOND_DEGREE' as const]
      : []),
  ]
  console.log('b3')
  const remainingFriendLevels = Array.difference(
    offer.offerInfo.privatePart.friendLevel,
    friendLevelsToRemove
  )

  console.log('b4')
  if (Array.isEmptyArray(remainingFriendLevels) && !offer.ownershipInfo)
    return Option.none()

  console.log('b5')
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
