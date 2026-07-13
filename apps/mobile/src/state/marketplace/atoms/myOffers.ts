import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type MyOfferInState,
  type OfferAdminId,
  type Sort,
} from '@vexl-next/domain/src/general/offers'
import updateOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/updateOwnerPrivatePayload'
import {Array, Effect, Schema, pipe} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {importedContactsHashesAtom} from '../../contacts/atom/contactsStore'
import {sessionDataOrDummyAtom} from '../../session'
import {isProductOfferMissingCategory} from '../utils/isProductOfferMissingCategory'
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

  return sortOffers(
    myOffers,
    sortingOptions,
    sortingOptions === 'MOST_CONNECTIONS'
      ? get(importedContactsHashesAtom)
      : undefined
  )
})

export const myOffersSortedAtomsAtom = splitAtom(
  myOffersSortedAtom,
  (offer) => offer.offerInfo.offerId
)

export const myActiveOffersAtom = focusAtom(myOffersAtom, (optic) =>
  optic.filter((myOffer) => myOffer.offerInfo.publicPart.active)
)

export const myProductOffersMissingCategoryAtom = atom((get) =>
  pipe(get(myOffersAtom), Array.filter(isProductOfferMissingCategory))
)

const accountActionStepsStorageAtom = atomWithParsedMmkvStorage(
  'accountActionSteps',
  {
    postedFirstOffer: false,
  },
  Schema.Struct({
    postedFirstOffer: Schema.Boolean,
  }),
  'account'
)

export const postedFirstOfferAtom = focusAtom(
  accountActionStepsStorageAtom,
  (optic) => optic.prop('postedFirstOffer')
)

export const hasPostedFirstOfferActionStepAtom = atom((get) => {
  return (
    get(postedFirstOfferAtom) ||
    pipe(get(myActiveOffersAtom), Array.isNonEmptyArray)
  )
})

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
