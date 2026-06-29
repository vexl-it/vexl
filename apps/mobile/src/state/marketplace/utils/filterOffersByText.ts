import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe} from 'effect'

import {type StoredContactWithComputedValues} from '../../contacts/domain'
import {deriveVisibleCommonFriendsForOffer} from './visibleCommonFriends'

const DIVIDER = ' ## '
export default function filterOffersByText({
  text,
  offers,
  importedContacts,
}: {
  text: string
  offers: OneOfferInState[]
  importedContacts: StoredContactWithComputedValues[]
}): OneOfferInState[] {
  // TODO - better search. This is just a placeholder

  const wordsToSearchFor = pipe(
    text.toUpperCase().trim().split(' '),
    Array.filter(Boolean)
  )
  const importedContactsHashes = pipe(
    importedContacts,
    Array.map((contact) => contact.computedValues.hash)
  )
  const contactsByHash = new Map<
    StoredContactWithComputedValues['computedValues']['hash'],
    StoredContactWithComputedValues[]
  >()

  for (const contact of importedContacts) {
    const contactsForHash = pipe(
      Option.fromNullable(contactsByHash.get(contact.computedValues.hash)),
      Option.getOrElse((): StoredContactWithComputedValues[] => [])
    )
    contactsByHash.set(contact.computedValues.hash, [
      ...contactsForHash,
      contact,
    ])
  }

  const offersWithSearchableString = pipe(
    offers,
    Array.map((offer) => {
      const visibleCommonFriends = deriveVisibleCommonFriendsForOffer({
        offerInfo: offer.offerInfo,
        importedContactsHashes,
      })

      return {
        offer,
        searchableString: [
          offer.offerInfo.publicPart.listingType,
          offer.offerInfo.publicPart.offerDescription,
          pipe(
            visibleCommonFriends.commonFriends,
            Array.flatMap((hash) =>
              pipe(
                Option.fromNullable(contactsByHash.get(hash)),
                Option.getOrElse((): StoredContactWithComputedValues[] => [])
              )
            ),
            Array.map((contact) =>
              [contact.info.name, contact.computedValues.normalizedNumber].join(
                DIVIDER
              )
            )
          ).join(DIVIDER),
          pipe(
            offer.offerInfo.publicPart.location ?? [],
            Array.map((one) => one.address ?? '')
          ).join(DIVIDER),
        ]
          .join(DIVIDER)
          .toUpperCase(),
      }
    })
  )

  return pipe(
    offersWithSearchableString,
    Array.filter((oneOffer) =>
      pipe(
        wordsToSearchFor,
        Array.every((oneWordToSearchFor) =>
          oneOffer.searchableString.includes(oneWordToSearchFor)
        )
      )
    ),
    Array.map((one) => one.offer)
  )
}
