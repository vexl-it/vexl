import {createContext, useContext} from 'react'

interface OffersListAnimation {
  readonly animateNextListChange: (applyChange: () => void) => Promise<void>
  readonly onOfferExitAnimationStart: (offerKey: string) => void
  readonly onOfferExitAnimationEnd: (offerKey: string) => void
}

const OffersListAnimationContext = createContext<OffersListAnimation>({
  animateNextListChange: (applyChange) => {
    applyChange()
    return Promise.resolve()
  },
  onOfferExitAnimationStart: () => {},
  onOfferExitAnimationEnd: () => {},
})

export const OffersListAnimationProvider = OffersListAnimationContext.Provider

export function useOffersListAnimation(): OffersListAnimation {
  return useContext(OffersListAnimationContext)
}
