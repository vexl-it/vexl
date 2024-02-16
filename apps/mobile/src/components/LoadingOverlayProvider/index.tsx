import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useMemo, type ReactNode} from 'react'
import {ActivityIndicator} from 'react-native'
import {Stack, getTokens, styled} from 'tamagui'

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

function LoadingOverlayProvider({children}: Props): JSX.Element {
  const isDisplayed = useAtomValue(loadingOverlayDisplayedAtom)
  const tokens = getTokens()
  return (
    <>
      {children}
      {!!isDisplayed && (
        <RootContainer>
          <ActivityIndicator size="large" color={tokens.color.main.val} />
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
