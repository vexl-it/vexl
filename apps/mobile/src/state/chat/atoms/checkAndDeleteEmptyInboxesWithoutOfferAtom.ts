import {Array, flow} from 'effect'
import {atom} from 'jotai'
import {myOffersAtom} from '../../marketplace/atoms/myOffers'
import messagingStateAtom from './messagingStateAtom'

export const checkAndDeleteEmptyInboxesWithoutOfferAtom = atom(
  null,
  (get, set) => {
    const myOffersIds = get(myOffersAtom).map(
      (offer) => offer.offerInfo.offerId
    )
    set(
      messagingStateAtom,
      flow(
        Array.filter(
          (one) =>
            // is my inbox
            !one.inbox.offerId ||
            // offer exists for that inbox
            myOffersIds.includes(one.inbox.offerId) ||
            // offer does not exist but there are non deleted chats
            (!myOffersIds.includes(one.inbox.offerId) && one.chats.length > 0)
        )
      )
    )
  }
)
