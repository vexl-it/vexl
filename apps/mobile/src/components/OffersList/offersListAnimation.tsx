import {createContext, useContext} from 'react'

interface OffersListAnimation {
  readonly animateNextListChange: () => void
}

const OffersListAnimationContext = createContext<OffersListAnimation>({
  animateNextListChange: () => {},
})

export const OffersListAnimationProvider = OffersListAnimationContext.Provider

export function useOffersListAnimation(): OffersListAnimation {
  return useContext(OffersListAnimationContext)
}
