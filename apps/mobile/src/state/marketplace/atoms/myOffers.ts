import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type MyOfferInState,
  type OfferAdminId,
  type Sort,
} from '@vexl-next/domain/src/general/offers'
import updateOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/updateOwnerPrivatePayload'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../../api'
import {sessionDataOrDummyAtom} from '../../session'
import sortOffers from '../utils/sortOffers'
import {offersAtom} from './offersState'

export const myOffersAtom = focusAtom(offersAtom, (optic) =>
  optic.filter(
    (offer): offer is MyOfferInState => !!offer.ownershipInfo?.adminId
  )
)

export const areThereAnyMyOffersAtom = atom((get) => {
  const myOffers = get(myOffersAtom)
  return myOffers.length > 0
})

export const myOffersSortedAtom = atom((get) => {
  const sortingOptions = get(selectedMyOffersSortingOptionAtom)
  const myOffers = get(myOffersAtom)

  return sortOffers(myOffers, sortingOptions)
})

export const myOffersSortedAtomsAtom = splitAtom(myOffersSortedAtom)

export const myActiveOffersAtom = focusAtom(myOffersAtom, (optic) =>
  optic.filter((myOffer) => myOffer.offerInfo.publicPart.active)
)

export const displayAddListingTypeAtom = atom<boolean>(true)

export const shouldDisplaySuggestionToAddListingTypeAtom = atom(
  (get) => {
    const myOffers = get(myOffersAtom)
    const displayAddListingType = get(displayAddListingTypeAtom)
    const anyOfferWithoutListingType = myOffers.some(
      (offer) => !offer.offerInfo.publicPart.listingType
    )

    return displayAddListingType && anyOfferWithoutListingType
  },
  (get, set, visible: boolean) => {
    set(displayAddListingTypeAtom, visible)
  }
)

export const selectedMyOffersSortingOptionAtom = atom<Sort>('NEWEST_OFFER')

export const updateMyOfferPrivatePayloadActionAtom = atom(
  null,
  (
    get,
    set,
    {
      adminId,
      intendedClubs,
      intendedConnectionLevel,
    }: {
      adminId: OfferAdminId
      intendedConnectionLevel: IntendedConnectionLevel
      intendedClubs: ClubUuid[]
    }
  ) =>
    Effect.gen(function* (_) {
      const offerToUpdate = yield* _(
        Array.findFirst(
          get(myOffersAtom),
          (offer) => offer.ownershipInfo.adminId === adminId
        )
      )

      const {payloadPrivate} = yield* _(
        updateOwnerPrivatePayload({
          adminId: offerToUpdate.ownershipInfo.adminId,
          symmetricKey: offerToUpdate.offerInfo.privatePart.symmetricKey,
          ownerCredentials: get(sessionDataOrDummyAtom).privateKey,
          ownerKeyPairV2: get(sessionDataOrDummyAtom).keyPairV2,
          intendedConnectionLevel,
          intendedClubs,
          api: get(apiAtom).offer,
        })
      )

      const updatedOffer = {
        ...offerToUpdate,
        offerInfo: {
          ...offerToUpdate.offerInfo,
          privatePart: payloadPrivate,
        },
        ownershipInfo: {
          adminId,
          intendedConnectionLevel,
          intendedClubs,
        },
      } satisfies MyOfferInState

      set(
        myOffersAtom,
        Array.map((one) =>
          one.ownershipInfo.adminId === adminId ? updatedOffer : one
        )
      )
    })
)
