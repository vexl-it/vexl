import styled from '@emotion/native'
import {type ReactNode, useMemo} from 'react'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useTheme} from '@emotion/react'

const RootContainer = styled.View`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
`
const ActivityIndicator = styled.ActivityIndicator``

interface Props {
  children: ReactNode
}

const isDisplayedAtom = atom(false)

function LoadingOverlayProvider({children}: Props): JSX.Element {
  const isDisplayed = useAtomValue(isDisplayedAtom)
  const theme = useTheme()
  return (
    <>
      {children}
      {isDisplayed && (
        <RootContainer>
          <ActivityIndicator size="large" color={theme.colors.main} />
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
