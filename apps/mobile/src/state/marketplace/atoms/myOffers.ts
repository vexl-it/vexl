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
import {
  type MyOffersSection,
  type OffersListItemData,
} from '../../../components/OffersList/domain'
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

export const myOffersCountAtom = atom((get) => get(myOffersAtom).length)

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

interface MyOffersListSection {
  readonly section: MyOffersSection
  readonly showHeader: boolean
  readonly offers: MyOfferInState[]
}

const sectionedMyOffersAtom = atom((get): MyOffersListSection[] => {
  const myOffers = get(myOffersSortedAtom)
  const pausedOffers = pipe(
    myOffers,
    Array.filter((offer) => !offer.offerInfo.publicPart.active)
  )

  if (!Array.isNonEmptyArray(pausedOffers)) {
    return [{section: 'ACTIVE', showHeader: false, offers: myOffers}]
  }

  const activeOffers = pipe(
    myOffers,
    Array.filter((offer) => offer.offerInfo.publicPart.active)
  )

  return pipe(
    [
      {section: 'ACTIVE', showHeader: true, offers: activeOffers},
      {section: 'PAUSED', showHeader: true, offers: pausedOffers},
    ] satisfies MyOffersListSection[],
    Array.filter((one) => Array.isNonEmptyArray(one.offers))
  )
})

const visibleMyOffersAtom = atom((get) =>
  pipe(
    get(sectionedMyOffersAtom),
    Array.flatMap((one) => one.offers)
  )
)

const visibleMyOffersAtomsAtom = splitAtom(
  visibleMyOffersAtom,
  (offer) => offer.offerInfo.offerId
)

export const myOffersListDataAtom = atom((get): OffersListItemData[] => {
  const sections = get(sectionedMyOffersAtom)
  const offerAtoms = get(visibleMyOffersAtomsAtom)

  const items: OffersListItemData[] = []
  let offerIndex = 0
  for (const {section, showHeader, offers} of sections) {
    if (showHeader) {
      items.push({
        type: 'sectionHeader',
        key: `sectionHeader-${section}`,
        section,
      })
    }

    for (const offer of offers) {
      const offerAtom = offerAtoms[offerIndex]
      offerIndex += 1
      if (offerAtom !== undefined) {
        items.push({
          type: 'offer',
          key: offer.offerInfo.offerId,
          offerAtom,
          swipeEnabled: false,
        })
      }
    }
  }

  return items
})

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
  })
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
