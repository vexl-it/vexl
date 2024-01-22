import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type ContactNormalizedWithHash} from '../../contacts/domain'

const DIVIDER = ' ## '
export default function filterOffersByText({
  text,
  offers,
  importedContacts,
}: {
  text: string
  offers: OneOfferInState[]
  importedContacts: ContactNormalizedWithHash[]
}): OneOfferInState[] {
  // TODO - better search. This is just a placeholder

  const wordsToSearchFor = text.toUpperCase().trim().split(' ').filter(Boolean)

  const offersWithSearchableString = offers.map((offer) => ({
    offer,
    searchableString: [
      offer.offerInfo.publicPart.offerDescription,
      offer.offerInfo.privatePart.commonFriends
        .map((hash) =>
          importedContacts
            .filter((one) => one.hash === hash)
            .map((o) => [o.name, o.normalizedNumber].join(DIVIDER))
            .join(DIVIDER)
        )
        .join(DIVIDER),
      offer.offerInfo.publicPart.location
        ?.map((one) => one.address ?? '')
        .join(DIVIDER),
    ]
      .join(DIVIDER)
      .toUpperCase(),
  }))

  return offersWithSearchableString
    .filter((oneOffer) =>
      wordsToSearchFor.every((oneWordToSearchFor) =>
        oneOffer.searchableString.includes(oneWordToSearchFor)
      )
    )
    .map((one) => one.offer)
}
