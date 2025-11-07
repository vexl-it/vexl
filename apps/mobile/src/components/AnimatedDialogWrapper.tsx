import {useFocusEffect} from '@react-navigation/native'
import React from 'react'
import {BackHandler, StyleSheet} from 'react-native'
import Animated, {FadeIn, SlideInDown} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, YStack} from 'tamagui'
import KeyboardAvoidingView from './KeyboardAvoidingView'

const styles = StyleSheet.create({
  backdrop: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  bounce: {flex: 1, zIndex: 2},
})

interface Props {
  children: React.ReactElement | React.ReactElement[]
  onBackButtonPressed: () => boolean
}

function AnimatedDialogWrapper({
  children,
  onBackButtonPressed,
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets()

  useFocusEffect(
    React.useCallback(() => {
      return BackHandler.addEventListener(
        'hardwareBackPress',
        onBackButtonPressed
      ).remove
    }, [onBackButtonPressed])
  )

  return (
    <Stack testID="@animatedDialog" position="absolute" t={0} l={0} r={0} b={0}>
      <KeyboardAvoidingView>
        <Animated.View
          entering={FadeIn}
          // TODO: check this with future versions of react-native-reanimated as there are multiple issues reported
          // that cause crashing on new arch with entering/exiting animations on Android edge-to-edge devices and iOS also
          // https://github.com/wix/react-native-navigation/issues/8096
          // https://github.com/software-mansion/react-native-reanimated/issues/7493
          // exiting={FadeOut}
          style={styles.backdrop}
        />
        <Animated.View
          style={styles.bounce}
          entering={SlideInDown}
          // exiting={SlideOutDown}
        >
          <YStack
            pt={insets.top}
            pl={insets.left}
            pr={insets.right}
            pb={insets.bottom}
            flex={1}
            gap="$2"
          >
            {children}
          </YStack>
        </Animated.View>
      </KeyboardAvoidingView>
    </Stack>
  )
}

export default AnimatedDialogWrapper
