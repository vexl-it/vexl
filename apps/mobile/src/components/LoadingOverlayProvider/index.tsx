import {Stack} from '@vexl-next/ui'
import {Effect} from 'effect/index'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo, type ReactNode} from 'react'
import VexlActivityIndicator from './VexlActivityIndicator'

interface Props {
  children: ReactNode
}

export const loadingOverlayDisplayedAtom = atom(false)

function LoadingOverlayProvider({children}: Props): React.ReactElement {
  const isDisplayed = useAtomValue(loadingOverlayDisplayedAtom)
  return (
    <>
      {children}
      {!!isDisplayed && (
        <Stack pos="absolute" t={0} l={0} r={0} b={0} ai="center" jc="center">
          <Stack
            pos="absolute"
            t={0}
            l={0}
            r={0}
            b={0}
            bg="$black100"
            opacity={0.5}
          />
          <VexlActivityIndicator size="large" bc="$accentYellowPrimary" />
        </Stack>
      )}
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
