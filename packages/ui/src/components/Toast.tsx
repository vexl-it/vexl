import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import type {TextStyle, ViewStyle} from 'react-native'
import {Animated, StyleSheet, Text, View} from 'react-native'
import {getTokens, useTheme} from 'tamagui'

import {bodyFont} from '../config/fonts'

const DISPLAY_DURATION = 3000
const FADE_DURATION = 300

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
  const [visible, setVisible] = useState(false)
  const theme = useTheme()

  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-10)).current
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!message) return

    clearTimer()
    setDisplayedMessage(message)
    setVisible(true)
    setMessage(null)

    hideTimerRef.current = setTimeout(() => {
      setVisible(false)
      hideTimerRef.current = null
    }, DISPLAY_DURATION)
  }, [message, setMessage, clearTimer])

  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  useEffect(() => {
    if (visible) {
      opacity.setValue(0)
      translateY.setValue(-10)

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setDisplayedMessage(null)
      })
    }
  }, [visible, opacity, translateY])

  const spaceTokens = getTokens().space
  const radiusTokens = getTokens().radius

  const pillStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.foregroundPrimary.val,
      borderRadius: radiusTokens.$4.val,
      paddingHorizontal: spaceTokens.$4.val,
      paddingVertical: spaceTokens.$3.val,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [theme.foregroundPrimary.val, radiusTokens, spaceTokens]
  )

  const labelStyle = useMemo<TextStyle>(
    () => ({
      fontFamily: bodyFont.family,
      fontWeight: bodyFont.weight?.[6] as TextStyle['fontWeight'],
      fontSize: bodyFont.size[2],
      letterSpacing: bodyFont.letterSpacing[2],
      color: theme.backgroundPrimary.val,
    }),
    [theme.backgroundPrimary.val]
  )

  return (
    <View style={[styles.container, {top: topOffset}]} pointerEvents="none">
      <Animated.View style={[pillStyle, {opacity, transform: [{translateY}]}]}>
        {displayedMessage ? (
          <Text style={labelStyle}>{displayedMessage}</Text>
        ) : null}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
})
