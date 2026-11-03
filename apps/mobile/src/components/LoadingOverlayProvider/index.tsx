import {LoadingOverlay} from '@vexl-next/ui'
import {Effect} from 'effect/index'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo, type ReactNode} from 'react'

interface Props {
  children: ReactNode
}

export const loadingOverlayDisplayedAtom = atom(false)

function LoadingOverlayProvider({children}: Props): React.ReactElement {
  const isDisplayed = useAtomValue(loadingOverlayDisplayedAtom)
  return (
    <>
      {children}
      <LoadingOverlay visible={isDisplayed} />
    </>
  )
}

export const withLoadingOverlayAtom = atom(
  null,
  (get, set) =>
    <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
      Effect.zipRight(
        Effect.sync(() => {
          set(loadingOverlayDisplayedAtom, true)
        }),
        effect
      ).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            set(loadingOverlayDisplayedAtom, false)
          })
        )
      )
)

export default LoadingOverlayProvider

export function useShowLoadingOverlay(): {
  show: () => void
  hide: () => void
  setDisplayed: (value: boolean) => void
} {
  const setDisplayed = useSetAtom(loadingOverlayDisplayedAtom)
  return useMemo(
    () => ({
      show: () => {
        setDisplayed(true)
      },
      hide: () => {
        setDisplayed(false)
      },
      setDisplayed,
    }),
    [setDisplayed]
  )
}
