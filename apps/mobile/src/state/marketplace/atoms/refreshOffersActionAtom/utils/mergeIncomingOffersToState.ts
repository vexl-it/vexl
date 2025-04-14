import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type OfferId,
  type OfferInfo,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import extractOwnerInfoFromOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/extractOwnerInfoFromOwnerPrivatePayload'
import {Array, Option} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {offerWithoutSourceOrNone} from '../../../utils/offerWithoutSourceOrNone'

export const mergeIncomingOffersToState = ({
  incomingOffers,
  storedOffers,
  removedOffersIds,
}: {
  incomingOffers: readonly OfferInfo[]
  storedOffers: readonly OneOfferInState[]
  removedOffersIds: {
    clubs: ReadonlyArray<{clubUuid: ClubUuid; removedIds: readonly OfferId[]}>
    contacts: readonly OfferId[]
  }
}): OneOfferInState[] =>
  pipe(
    Array.union(
      Array.map(incomingOffers, (one) => one.offerId),
      Array.map(storedOffers, (one) => one.offerInfo.offerId)
    ),
    // Process new offers
    Array.filterMap((offerId) => {
      const newOfferO = Array.findFirst(
        incomingOffers,
        (o) => o.offerId === offerId
      )
      const offerInStateO = pipe(
        storedOffers,
        Array.findFirst((one) => one.offerInfo.offerId === offerId)
      )

      if (
        offerInStateO.pipe(
          Option.flatMapNullable((o) => o?.ownershipInfo?.adminId),
          Option.isSome
        )
      ) {
        // D not update offers that are owned the by current user.
        return offerInStateO
      }

      if (Option.isSome(offerInStateO) && Option.isSome(newOfferO)) {
        return Option.some({
          ...offerInStateO.value,
          offerInfo: newOfferO.value,
        } satisfies OneOfferInState)
      }

      if (Option.isSome(newOfferO)) {
        return Option.some({
          offerInfo: newOfferO.value,
          flags: {
            reported: false,
          },
        } as OneOfferInState)
      }

      return offerInStateO
    }),
    // Process removed offers
    Array.filterMap((one) => {
      // Do NOT remove offers that are owned by current user.
      // They can be re-uploaded
      if (one.ownershipInfo?.adminId) return Option.some(one)

      const removedFromClubs = pipe(
        removedOffersIds.clubs,
        Array.filter(({removedIds}) =>
          Array.contains(removedIds, one.offerInfo.offerId)
        ),
        Array.map((one) => one.clubUuid)
      )
      const removedFromContacts = Array.contains(
        removedOffersIds.contacts,
        one.offerInfo.offerId
      )
      return offerWithoutSourceOrNone(
        one,
        removedFromClubs,
        removedFromContacts
      )
    }),
    // Process offers that have adminId in private part but do not have ownershipInfo
    Array.filterMap((oneOffer) => {
      if (!oneOffer.ownershipInfo && !!oneOffer.offerInfo.privatePart.adminId) {
        // TODO handle offerToConnections
        return pipe(
          extractOwnerInfoFromOwnerPrivatePayload(
            oneOffer.offerInfo.privatePart
          ),
          Option.map((ownershipInfo) => ({
            ...oneOffer,
            ownershipInfo,
          }))
        )
      }
      return Option.some(oneOffer)
    })
  )
