import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {styled} from 'tamagui'

import {SizableText, Stack} from '../primitives'

const DISPLAY_DURATION = 3000
const ANIMATION_DURATION = 300
const HIDDEN_TRANSLATE_Y = -10

const ToastViewport = styled(Stack, {
  name: 'ToastViewport',
  position: 'absolute',
  left: 0,
  right: 0,
  alignItems: 'center',
  zIndex: 9999,
})

const ToastPill = styled(Stack, {
  name: 'ToastPill',
  backgroundColor: '$foregroundPrimary',
  borderRadius: '$4',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  justifyContent: 'center',
})

const ToastLabel = styled(SizableText, {
  name: 'ToastLabel',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  color: '$backgroundPrimary',
})

export interface ToastProps {
  readonly messageAtom: WritableAtom<
    string | null,
    [SetStateAction<string | null>],
    void
  >
  readonly topOffset?: number
}

export function Toast({
  messageAtom,
  topOffset = 0,
}: ToastProps): React.JSX.Element {
  const [message, setMessage] = useAtom(messageAtom)
  const [displayedMessage, setDisplayedMessage] = useState<string | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animationCycleRef = useRef(0)

  const opacity = useSharedValue(0)
  const translateY = useSharedValue(HIDDEN_TRANSLATE_Y)

  const clearTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const clearDisplayedMessage = useCallback((cycle: number) => {
    if (animationCycleRef.current !== cycle) return
    setDisplayedMessage(null)
  }, [])

  const showToast = useCallback(() => {
    cancelAnimation(opacity)
    cancelAnimation(translateY)
    opacity.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    })
    translateY.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    })
  }, [opacity, translateY])

  const hideToast = useCallback(
    (cycle: number) => {
      cancelAnimation(opacity)
      cancelAnimation(translateY)
      opacity.value = withTiming(
        0,
        {
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            scheduleOnRN(clearDisplayedMessage, cycle)
          }
        }
      )
      translateY.value = withTiming(HIDDEN_TRANSLATE_Y, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      })
    },
    [clearDisplayedMessage, opacity, translateY]
  )

  useEffect(() => {
    if (!message) return

    clearTimer()
    animationCycleRef.current += 1
    const cycle = animationCycleRef.current
    setDisplayedMessage(message)
    setMessage(null)
    showToast()

    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null
      hideToast(cycle)
    }, DISPLAY_DURATION)
  }, [clearTimer, hideToast, message, setMessage, showToast])

  useEffect(() => {
    return () => {
      clearTimer()
      cancelAnimation(opacity)
      cancelAnimation(translateY)
    }
  }, [clearTimer, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: translateY.value}],
  }))

  return (
    <ToastViewport top={topOffset} pointerEvents="none">
      <Animated.View
        accessibilityElementsHidden={!displayedMessage}
        importantForAccessibility={
          displayedMessage ? 'auto' : 'no-hide-descendants'
        }
        style={animatedStyle}
      >
        <ToastPill>
          <ToastLabel>{displayedMessage ?? ''}</ToastLabel>
        </ToastPill>
      </Animated.View>
    </ToastViewport>
  )
}
