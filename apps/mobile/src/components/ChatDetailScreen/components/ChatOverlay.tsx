import {BlurView} from '@react-native-community/blur'
import {Stack, useTheme} from '@vexl-next/ui'
import React, {useCallback, useEffect} from 'react'
import {BackHandler, Platform, Pressable, StyleSheet} from 'react-native'
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {useTranslation} from '../../../utils/localization/I18nProvider'

export const OVERLAY_OPEN_SPRING = {damping: 20, stiffness: 260, mass: 0.8}
const CLOSE_DURATION_MS = 160

/**
 * Springs the overlay in when it opens. `close` animates it out first and
 * then calls `onClosed`, which should unmount the overlay. Android back
 * closes it too.
 */
export function useChatOverlayTransition({
  isOpen,
  onClosed,
}: {
  isOpen: boolean
  onClosed: () => void
}): {progress: SharedValue<number>; close: () => void} {
  const progress = useSharedValue(0)

  useEffect(() => {
    if (!isOpen) return
    progress.value = 0
    progress.value = withSpring(1, OVERLAY_OPEN_SPRING)
  }, [isOpen, progress])

  const close = useCallback(() => {
    progress.value = withTiming(
      0,
      {duration: CLOSE_DURATION_MS},
      (finished) => {
        if (finished) scheduleOnRN(onClosed)
      }
    )
  }, [onClosed, progress])

  useEffect(() => {
    if (!isOpen) return
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        close()
        return true
      }
    )
    return () => {
      subscription.remove()
    }
  }, [close, isOpen])

  return {progress, close}
}

export function ChatOverlayScrim({
  progress,
  onPress,
}: {
  progress: SharedValue<number>
  onPress: () => void
}): React.ReactElement {
  const theme = useTheme()
  const {t} = useTranslation()
  const scrimStyle = useAnimatedStyle(() => ({opacity: progress.value}))

  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        role="button"
        aria-label={t('common.close')}
        onPress={onPress}
      >
        {Platform.OS === 'ios' && (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={12}
            reducedTransparencyFallbackColor={theme.backgroundSecondary.get()}
          />
        )}
        <Stack
          style={StyleSheet.absoluteFill}
          backgroundColor="$backgroundSecondary"
          opacity={Platform.OS === 'ios' ? 0.4 : 0.9}
        />
      </Pressable>
    </Reanimated.View>
  )
}
