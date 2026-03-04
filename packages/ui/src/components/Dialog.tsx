import React, {useEffect, useState} from 'react'
import {Dimensions, Modal, Pressable, StyleSheet} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {styled} from 'tamagui'

import {SizableText, Stack, XStack, YStack} from '../primitives'

const SCREEN_HEIGHT = Dimensions.get('window').height
const ANIMATION_DURATION = 300
const BACKDROP_OPACITY = 0.5
const AUTO_DISMISS_MS = 3000

export const DialogLabel = styled(SizableText, {
  name: 'DialogLabel',
  fontFamily: '$body',
  fontSize: '$1',
  fontWeight: '500',
  letterSpacing: '$1',
  color: '$foregroundSecondary',
})

export const DialogTitle = styled(SizableText, {
  name: 'DialogTitle',
  fontFamily: '$heading',
  fontSize: '$4',
  fontWeight: '400',
  color: '$foregroundPrimary',
})

export const DialogDescription = styled(SizableText, {
  name: 'DialogDescription',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '500',
  letterSpacing: '$3',
  color: '$foregroundSecondary',
})

export interface DialogProps {
  readonly visible: boolean
  readonly onClose?: () => void
  readonly children: React.ReactNode
  readonly footer?: React.ReactNode
}

export function Dialog({
  visible,
  onClose,
  children,
  footer,
}: DialogProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false)

  const backdropOpacity = useSharedValue(0)
  const translateY = useSharedValue(SCREEN_HEIGHT)

  const hasFooter = footer != null

  useEffect(() => {
    if (visible) {
      setMounted(true)
      backdropOpacity.value = withTiming(BACKDROP_OPACITY, {
        duration: ANIMATION_DURATION,
      })
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    } else {
      backdropOpacity.value = withTiming(0, {duration: ANIMATION_DURATION})
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        {duration: ANIMATION_DURATION, easing: Easing.in(Easing.cubic)},
        (finished) => {
          if (finished) {
            scheduleOnRN(setMounted, false)
          }
        }
      )
    }
  }, [visible, backdropOpacity, translateY])

  useEffect(() => {
    if (visible && !hasFooter && onClose) {
      const timer = setTimeout(onClose, AUTO_DISMISS_MS)
      return () => {
        clearTimeout(timer)
      }
    }
    return undefined
  }, [visible, hasFooter, onClose])

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }))

  if (!mounted) return null

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <Stack flex={1} justifyContent="flex-end">
        <Animated.View style={[StyleSheet.absoluteFill, backdropAnimatedStyle]}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View style={contentAnimatedStyle}>
          <YStack
            paddingTop="$4"
            paddingBottom="$8"
            paddingHorizontal="$4"
            gap="$2"
          >
            <YStack
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              padding="$4"
              gap="$4"
            >
              {children}
            </YStack>
            {footer != null ? <XStack gap="$2">{footer}</XStack> : null}
          </YStack>
        </Animated.View>
      </Stack>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'black',
  },
})
