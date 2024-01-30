import {useFocusEffect} from '@react-navigation/native'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {StyleSheet} from 'react-native'
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler'
import Animated, {FadeIn, runOnJS} from 'react-native-reanimated'
import {Stack} from 'tamagui'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import PageWithNavigationHeader from '../../PageWithNavigationHeader'

const styles = StyleSheet.create({
  backdrop: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
})

export const isTradeChecklistFullScreenAtom = atom(false)

function GoBackOnSwipeDown({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const goBack = useSafeGoBack()

  return (
    <GestureDetector
      gesture={Gesture.Fling()
        .direction(Directions.DOWN)
        .onEnd(() => {
          runOnJS(goBack)()
        })}
    >
      {children}
    </GestureDetector>
  )
}

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
          <Animated.View entering={FadeIn.delay(200)} style={styles.backdrop} />
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
