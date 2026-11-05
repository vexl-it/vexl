import Clipboard from '@react-native-clipboard/clipboard'
import {BlurView} from '@react-native-community/blur'
import {ReactionEmoji} from '@vexl-next/domain/src/general/messaging'
import {
  CONTEXT_MENU_WIDTH,
  ContextMenu,
  contextMenuHeight,
  ContextMenuItem,
  Copy,
  REACTION_BAR_HEIGHT,
  ReactionBar,
  reactionBarWidth,
  Reply,
  Stack,
  tokens,
  useTheme,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Effect, Schema} from 'effect'
import {impactAsync, ImpactFeedbackStyle} from 'expo-haptics'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import {useKeyboardState} from 'react-native-keyboard-controller'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {scheduleOnRN} from 'react-native-worklets'
import {canReactToMessage} from '../../../state/chat/atoms/sendReactionActionAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import {chatMolecule, type MessageLayout} from '../atoms'
import MessageBubble, {PRESSED_BUBBLE_SCALE} from './MessageBubble'

const QUICK_REACTIONS = Array.map(
  ['❤️', '👍', '👎', '😂', '😮', '😢'],
  (emoji) => Schema.decodeSync(ReactionEmoji)(emoji)
)
const REACTION_BAR_WIDTH = reactionBarWidth(QUICK_REACTIONS.length)
const GAP = tokens.space[3].val
const SCREEN_PADDING = tokens.space[5].val
const MENU_HEIGHT = contextMenuHeight(2)
const OPEN_SPRING = {damping: 20, stiffness: 260, mass: 0.8}
const CLOSE_DURATION_MS = 160

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function computePlacement({
  layout,
  isMine,
  showReactions,
  windowWidth,
  insetTop,
  bottomLimit,
}: {
  layout: MessageLayout
  isMine: boolean
  showReactions: boolean
  windowWidth: number
  insetTop: number
  bottomLimit: number
}): {
  bubbleTop: number
  bubbleHeight: number
  reactionBarTop: number
  reactionBarLeft: number
  menuTop: number
  menuLeft: number
} {
  const minBubbleTop =
    insetTop + SCREEN_PADDING + (showReactions ? REACTION_BAR_HEIGHT + GAP : 0)
  const maxBubbleBottom = bottomLimit - SCREEN_PADDING - MENU_HEIGHT - GAP
  // Very long messages are clipped so the actions always stay on screen.
  const bubbleHeight = Math.min(layout.height, maxBubbleBottom - minBubbleTop)
  const maxBubbleTop = maxBubbleBottom - bubbleHeight
  const bubbleTop = Math.max(minBubbleTop, Math.min(layout.y, maxBubbleTop))
  const alignedToBubble = (width: number): number =>
    clamp(
      isMine ? layout.x + layout.width - width : layout.x,
      SCREEN_PADDING,
      windowWidth - SCREEN_PADDING - width
    )

  return {
    bubbleTop,
    bubbleHeight,
    reactionBarTop: bubbleTop - GAP - REACTION_BAR_HEIGHT,
    reactionBarLeft: alignedToBubble(REACTION_BAR_WIDTH),
    menuTop: bubbleTop + bubbleHeight + GAP,
    menuLeft: alignedToBubble(CONTEXT_MENU_WIDTH),
  }
}

function MessageActionsOverlay(): React.ReactElement | null {
  const theme = useTheme()
  const {t} = useTranslation()
  const insets = useSafeAreaInsets()
  const {width: windowWidth, height: windowHeight} = useWindowDimensions()
  const keyboardHeight = useKeyboardState((state) => state.height)
  const {
    messageActionsSelectionAtom,
    replyToMessageAtom,
    reactionsAtom,
    canSendReactionsAtom,
    sendReactionAtom,
  } = useMolecule(chatMolecule)
  const [selection, setSelection] = useAtom(messageActionsSelectionAtom)
  const setReplyToMessage = useSetAtom(replyToMessageAtom)
  const reactions = useAtomValue(reactionsAtom)
  const canSendReactions = useAtomValue(canSendReactionsAtom)
  const sendReaction = useSetAtom(sendReactionAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const progress = useSharedValue(0)
  const bubbleScale = useSharedValue(PRESSED_BUBBLE_SCALE)
  const layout = selection?.layout
  const isMine = selection?.message.state !== 'received'
  const showReactions =
    canSendReactions && !!selection && canReactToMessage(selection.message)
  const placement =
    layout &&
    computePlacement({
      layout,
      isMine,
      showReactions,
      windowWidth,
      insetTop: insets.top,
      bottomLimit: windowHeight - Math.max(insets.bottom, keyboardHeight),
    })
  const bubbleOffsetY = layout && placement ? layout.y - placement.bubbleTop : 0

  useEffect(() => {
    if (!selection) return
    void impactAsync(ImpactFeedbackStyle.Medium)
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

  const reactionBarStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {scale: interpolate(progress.value, [0, 1], [0.6, 1])},
      {translateY: interpolate(progress.value, [0, 1], [bubbleOffsetY, 0])},
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
  const messageReactions = reactions[message.message.uuid]

  const react = (emoji: ReactionEmoji): void => {
    Effect.runFork(
      sendReaction({
        targetMessageId: message.message.uuid,
        emoji: messageReactions?.mine === emoji ? undefined : emoji,
      }).pipe(
        Effect.catchAll((e) =>
          Effect.sync(() => {
            reportError('warn', new Error('Error sending reaction'), {e})
            setToastNotification(t('common.somethingWentWrong'))
          })
        )
      )
    )
    close()
  }

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
            height: placement.bubbleHeight,
            overflow: 'hidden',
          },
          bubbleStyle,
        ]}
      >
        <MessageBubble message={message} reactions={messageReactions} />
      </Reanimated.View>
      {!!showReactions && (
        <Reanimated.View
          style={[
            {
              position: 'absolute',
              top: placement.reactionBarTop,
              left: placement.reactionBarLeft,
              transformOrigin: `${isMine ? 'right' : 'left'} bottom`,
            },
            reactionBarStyle,
          ]}
        >
          <ReactionBar
            emojis={QUICK_REACTIONS}
            selected={messageReactions?.mine}
            progress={progress}
            onSelect={react}
          />
        </Reanimated.View>
      )}
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            top: placement.menuTop,
            left: placement.menuLeft,
            transformOrigin: `${isMine ? 'right' : 'left'} top`,
          },
          menuStyle,
        ]}
      >
        <ContextMenu>
          <ContextMenuItem
            icon={Reply}
            label={t('common.reply')}
            onPress={() => {
              setReplyToMessage(message)
              close()
            }}
          />
          <ContextMenuItem
            icon={Copy}
            label={t('common.copy')}
            onPress={() => {
              Clipboard.setString(message.message.text)
              setToastNotification(t('common.copied'))
              close()
            }}
          />
        </ContextMenu>
      </Reanimated.View>
    </Stack>
  )
}

export default MessageActionsOverlay
