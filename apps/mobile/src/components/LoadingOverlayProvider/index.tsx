import {type ReactNode, useMemo} from 'react'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {ActivityIndicator} from 'react-native'
import {getTokens, Stack, styled} from 'tamagui'

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

const isDisplayedAtom = atom(false)

function LoadingOverlayProvider({children}: Props): JSX.Element {
  const isDisplayed = useAtomValue(isDisplayedAtom)
  const tokens = getTokens()
  return (
    <>
      {children}
      {isDisplayed && (
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
  const setDisplayed = useSetAtom(isDisplayedAtom)
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
