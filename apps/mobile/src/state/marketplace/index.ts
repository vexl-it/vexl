import {type ChatOrigin} from '@vexl-next/domain/src/general/messaging'
import {
  type OfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ApiErrorFetchingOffers} from '@vexl-next/resources-utils/src/offers/getNewOffersAndDecrypt'
import {type ErrorSigningChallenge} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {loadingStateAtom} from './atoms/loadingState'
import {offerForChatOriginAtom, singleOfferAtom} from './atoms/offersState'

export function useAreOffersLoading(): boolean {
  const offerState = useAtomValue(loadingStateAtom)

  return offerState.state === 'inProgress'
}

export function useOffersLoadingError(): Option.Option<
  ApiErrorFetchingOffers | CryptoError | ErrorSigningChallenge
> {
  const offerState = useAtomValue(loadingStateAtom)

  return offerState.state === 'error'
    ? Option.some(offerState.error)
    : Option.none()
}

export function useSingleOffer(
  offerId: OfferId | undefined
): Option.Option<OneOfferInState> {
  const foundOffer = useAtomValue(
    useMemo(() => singleOfferAtom(offerId), [offerId])
  )
  return Option.fromNullable(foundOffer)
}

export function useOfferForChatOrigin(
  chatOrigin: ChatOrigin
): OneOfferInState | undefined {
  return useAtomValue(
    useMemo(() => offerForChatOriginAtom(chatOrigin), [chatOrigin])
  )
}
