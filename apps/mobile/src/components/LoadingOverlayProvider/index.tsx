import {atom, useAtomValue, useSetAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {useMemo, type ReactNode} from 'react'
import {ActivityIndicator} from 'react-native'
import {Stack, Text, getTokens, styled} from 'tamagui'

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
export const loadingOverlayAtom = atom<{loading: boolean; message?: string}>({
  loading: false,
})

export const loadingOverlayDisplayedAtom = focusAtom(loadingOverlayAtom, (o) =>
  o.prop('loading')
)
export const loadingOverlayMessageAtom = focusAtom(loadingOverlayAtom, (o) =>
  o.prop('message')
)

function LoadingOverlayProvider({children}: Props): JSX.Element {
  const isDisplayed = useAtomValue(loadingOverlayDisplayedAtom)
  const loadingOverlayMessage = useAtomValue(loadingOverlayMessageAtom)
  const tokens = getTokens()

  return (
    <>
      {children}
      {isDisplayed && (
        <RootContainer>
          <Stack ai="center" jc="center">
            <ActivityIndicator size="large" color={tokens.color.main.val} />
            {loadingOverlayMessage && (
              <Text col="$main" fs={24}>
                {loadingOverlayMessage}
              </Text>
            )}
          </Stack>
        </RootContainer>
      )}
    </>
  )
}

export default LoadingOverlayProvider

export function useShowLoadingOverlay(): {
  show: (message?: string) => void
  hide: () => void
  setDisplayed: (value: boolean, message?: string) => void
} {
  const setDisplayed = useSetAtom(loadingOverlayAtom)
  return useMemo(
    () => ({
      show: (message) => {
        setDisplayed({loading: true, message})
      },
      hide: () => {
        setDisplayed({loading: false})
      },
      setDisplayed: (loading) => {
        setDisplayed({loading})
      },
    }),
    [setDisplayed]
  )
}
