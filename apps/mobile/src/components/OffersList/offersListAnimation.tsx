import {createContext, useContext} from 'react'

interface OffersListAnimation {
  readonly animateNextListChange: () => void
  readonly onOfferExitAnimationStart: (offerKey: string) => void
  readonly onOfferExitAnimationEnd: (offerKey: string) => void
}

const OffersListAnimationContext = createContext<OffersListAnimation>({
  animateNextListChange: () => {},
  onOfferExitAnimationStart: () => {},
  onOfferExitAnimationEnd: () => {},
})

export const OffersListAnimationProvider = OffersListAnimationContext.Provider

export function useOffersListAnimation(): OffersListAnimation {
  return useContext(OffersListAnimationContext)
}
