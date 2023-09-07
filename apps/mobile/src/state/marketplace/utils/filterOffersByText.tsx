import {type OneOfferInState} from '@vexl-next/domain/dist/general/offers'
import {type ContactNormalizedWithHash} from '../../contacts/domain'
import {matchSorter} from 'match-sorter'

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

  const offersWithSearchableString = offers.map((offer) => ({
    offer,
    searchableString: [
      offer.offerInfo.publicPart.offerDescription,
      offer.offerInfo.privatePart.commonFriends
        .map((hash) =>
          importedContacts
            .filter((one) => one.hash === hash)
            .map((o) => [o.name, o.normalizedNumber].join(' '))
            .join(' ')
        )
        .join(' '),
      offer.offerInfo.publicPart.location
        ?.map((one) => one.city ?? '')
        .join(' '),
    ].join(' '),
  }))

  return matchSorter(offersWithSearchableString, text, {
    keys: ['searchableString'],
  }).map((one) => one.offer)
}
