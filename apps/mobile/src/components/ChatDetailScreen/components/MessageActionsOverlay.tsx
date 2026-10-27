import Clipboard from '@react-native-clipboard/clipboard'
import {BlurView} from '@react-native-community/blur'
import {
  Copy,
  Reply,
  Stack,
  tokens,
  Typography,
  useTheme,
  XStack,
  type IconProps,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {impactAsync, ImpactFeedbackStyle} from 'expo-haptics'
import {useAtom, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import {KeyboardController} from 'react-native-keyboard-controller'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {scheduleOnRN} from 'react-native-worklets'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import {chatMolecule, type MessageLayout} from '../atoms'
import MessageBubble, {PRESSED_BUBBLE_SCALE} from './MessageBubble'

const GAP = tokens.space[3].val
const SCREEN_PADDING = tokens.space[5].val
const MENU_WIDTH = tokens.size[13].val * 2.5
const MENU_ITEM_HEIGHT = tokens.size[10].val
const MENU_PADDING = tokens.space[2].val
const MENU_ITEMS_COUNT = 2
const MENU_HEIGHT = MENU_ITEM_HEIGHT * MENU_ITEMS_COUNT + MENU_PADDING * 2
const OPEN_SPRING = {damping: 20, stiffness: 260, mass: 0.8}
const CLOSE_DURATION_MS = 160
const SURFACE_SHADOW = '0 4px 16px rgba(0, 0, 0, 0.12)'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function computePlacement({
  layout,
  isMine,
  windowWidth,
  windowHeight,
  insetTop,
  insetBottom,
}: {
  layout: MessageLayout
  isMine: boolean
  windowWidth: number
  windowHeight: number
  insetTop: number
  insetBottom: number
}): {bubbleTop: number; menuTop: number; menuLeft: number} {
  const minBubbleTop = insetTop + SCREEN_PADDING
  const maxBubbleTop =
    windowHeight -
    insetBottom -
    SCREEN_PADDING -
    MENU_HEIGHT -
    GAP -
    layout.height
  const bubbleTop = Math.max(minBubbleTop, Math.min(layout.y, maxBubbleTop))

  return {
    bubbleTop,
    menuTop: bubbleTop + layout.height + GAP,
    menuLeft: clamp(
      isMine ? layout.x + layout.width - MENU_WIDTH : layout.x,
      SCREEN_PADDING,
      windowWidth - SCREEN_PADDING - MENU_WIDTH
    ),
  }
}

function MenuItem({
  icon: Icon,
  label,
  onPress,
}: {
  icon: React.ComponentType<IconProps>
  label: string
  onPress: () => void
}): React.ReactElement {
  const theme = useTheme()

  return (
    <XStack
      role="button"
      height={MENU_ITEM_HEIGHT}
      alignItems="center"
      gap="$4"
      px="$5"
      pressStyle={{backgroundColor: '$backgroundSecondary'}}
      onPress={onPress}
    >
      <Icon size={20} color={theme.foregroundPrimary.get()} />
      <Typography variant="paragraph" color="$foregroundPrimary">
        {label}
      </Typography>
    </XStack>
  )
}

function MessageActionsOverlay(): React.ReactElement | null {
  const theme = useTheme()
  const {t} = useTranslation()
  const insets = useSafeAreaInsets()
  const {width: windowWidth, height: windowHeight} = useWindowDimensions()
  const {messageActionsSelectionAtom, replyToMessageAtom} =
    useMolecule(chatMolecule)
  const [selection, setSelection] = useAtom(messageActionsSelectionAtom)
  const setReplyToMessage = useSetAtom(replyToMessageAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const progress = useSharedValue(0)
  const bubbleScale = useSharedValue(PRESSED_BUBBLE_SCALE)
  const layout = selection?.layout
  const isMine = selection?.message.state !== 'received'
  const placement =
    layout &&
    computePlacement({
      layout,
      isMine,
      windowWidth,
      windowHeight,
      insetTop: insets.top,
      insetBottom: insets.bottom,
    })
  const bubbleOffsetY = layout && placement ? layout.y - placement.bubbleTop : 0

  useEffect(() => {
    if (!selection) return
    void impactAsync(ImpactFeedbackStyle.Medium)
    void KeyboardController.dismiss()
    progress.value = 0
    bubbleScale.value = PRESSED_BUBBLE_SCALE
    progress.value = withSpring(1, OPEN_SPRING)
    bubbleScale.value = withSpring(1, OPEN_SPRING)
  }, [bubbleScale, progress, selection])

  const clearSelection = useCallback(() => {
    setSelection(null)
  }, [setSelection])

  const close = useCallback(() => {
    progress.value = withTiming(
      0,
      {duration: CLOSE_DURATION_MS},
      (finished) => {
        if (finished) scheduleOnRN(clearSelection)
      }
    )
  }, [clearSelection, progress])

  useEffect(() => {
    if (!selection) return
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
  }, [close, selection])

  const scrimStyle = useAnimatedStyle(() => ({opacity: progress.value}))

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: bubbleOffsetY * (1 - progress.value)},
      {scale: bubbleScale.value},
    ],
  }))

  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {scale: interpolate(progress.value, [0, 1], [0.8, 1])},
      {translateY: interpolate(progress.value, [0, 1], [bubbleOffsetY, 0])},
    ],
  }))

  if (!selection || !layout || !placement) return null
  const {message} = selection

  return (
    <Stack style={StyleSheet.absoluteFill}>
      <Reanimated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close}>
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
      <Reanimated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: placement.bubbleTop,
            left: layout.x,
            width: layout.width,
          },
          bubbleStyle,
        ]}
      >
        <MessageBubble message={message} />
      </Reanimated.View>
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            top: placement.menuTop,
            left: placement.menuLeft,
            width: MENU_WIDTH,
            transformOrigin: `${isMine ? 'right' : 'left'} top`,
          },
          menuStyle,
        ]}
      >
        <Stack
          py={MENU_PADDING}
          borderRadius="$6"
          overflow="hidden"
          backgroundColor="$backgroundOnBar"
          boxShadow={SURFACE_SHADOW}
        >
          <MenuItem
            icon={Reply}
            label={t('common.reply')}
            onPress={() => {
              setReplyToMessage(message)
              close()
            }}
          />
          <MenuItem
            icon={Copy}
            label={t('common.copy')}
            onPress={() => {
              Clipboard.setString(message.message.text)
              setToastNotification(t('common.copied'))
              close()
            }}
          />
        </Stack>
      </Reanimated.View>
    </Stack>
  )
}

export default MessageActionsOverlay
