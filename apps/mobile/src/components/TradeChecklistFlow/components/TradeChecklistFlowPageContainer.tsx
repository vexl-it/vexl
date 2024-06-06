import {useFocusEffect} from '@react-navigation/native'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import Animated, {FadeIn} from 'react-native-reanimated'
import {Stack} from 'tamagui'
import {backdropStyles} from '../../../utils/backdropStyles'
import GoBackOnSwipeDown from '../../GoBackOnSwipeDown'
import PageWithNavigationHeader from '../../PageWithNavigationHeader'

export const isTradeChecklistFullScreenAtom = atom(false)

export function useSetFullscreen(): void {
  const setFullscreen = useSetAtom(isTradeChecklistFullScreenAtom)

  useFocusEffect(
    useCallback(() => {
      setFullscreen(true)

      return () => {
        setFullscreen(false)
      }
    }, [setFullscreen])
  )
}

export default function TradeChecklistFlowPageContainer({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const isFullScreen = useAtomValue(isTradeChecklistFullScreenAtom)

  return (
    <>
      {!isFullScreen && (
        <>
          <Animated.View
            entering={FadeIn.delay(200)}
            style={backdropStyles.backdrop}
          />
          <Stack h={100} />
          <GoBackOnSwipeDown>
            <Stack bc="$black" pt="$2">
              <Stack width={36} h={5} als="center" bc="$greyAccent1" br="$5" />
            </Stack>
          </GoBackOnSwipeDown>
        </>
      )}
      <PageWithNavigationHeader fullScreen={isFullScreen}>
        {children}
      </PageWithNavigationHeader>
    </>
  )
}
