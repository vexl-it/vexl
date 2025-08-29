import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo, type ReactNode} from 'react'
import {Stack, styled} from 'tamagui'
import VexlActivityIndicator from './VexlActivityIndicator'

const RootContainer = styled(Stack, {
  pos: 'absolute',
  t: 0,
  l: 0,
  r: 0,
  b: 0,
  ai: 'center',
  jc: 'center',
  bg: 'rgba(0, 0, 0, 0.5)',
})

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
        <RootContainer>
          <VexlActivityIndicator size="large" bc="$main" />
        </RootContainer>
      )}
    </>
  )
}

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
