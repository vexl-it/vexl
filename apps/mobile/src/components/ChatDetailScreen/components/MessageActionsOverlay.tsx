import Clipboard from '@react-native-clipboard/clipboard'
import {BlurView} from '@react-native-community/blur'
import {ReactionEmoji} from '@vexl-next/domain/src/general/messaging'
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
import {KeyboardController} from 'react-native-keyboard-controller'
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
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
const REACTION_SIZE = tokens.size[9].val
const REACTION_BAR_PADDING = tokens.space[2].val
const REACTION_BAR_HEIGHT = REACTION_SIZE + REACTION_BAR_PADDING * 2
const REACTION_BAR_WIDTH =
  REACTION_SIZE * QUICK_REACTIONS.length + REACTION_BAR_PADDING * 2
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
  showReactions,
  windowWidth,
  windowHeight,
  insetTop,
  insetBottom,
}: {
  layout: MessageLayout
  isMine: boolean
  showReactions: boolean
  windowWidth: number
  windowHeight: number
  insetTop: number
  insetBottom: number
}): {
  bubbleTop: number
  reactionBarTop: number
  reactionBarLeft: number
  menuTop: number
  menuLeft: number
} {
  const minBubbleTop =
    insetTop + SCREEN_PADDING + (showReactions ? REACTION_BAR_HEIGHT + GAP : 0)
  const maxBubbleTop =
    windowHeight -
    insetBottom -
    SCREEN_PADDING -
    MENU_HEIGHT -
    GAP -
    layout.height
  const bubbleTop = Math.max(minBubbleTop, Math.min(layout.y, maxBubbleTop))
  const alignedToBubble = (width: number): number =>
    clamp(
      isMine ? layout.x + layout.width - width : layout.x,
      SCREEN_PADDING,
      windowWidth - SCREEN_PADDING - width
    )

  return {
    bubbleTop,
    reactionBarTop: bubbleTop - GAP - REACTION_BAR_HEIGHT,
    reactionBarLeft: alignedToBubble(REACTION_BAR_WIDTH),
    menuTop: bubbleTop + layout.height + GAP,
    menuLeft: alignedToBubble(MENU_WIDTH),
  }
}

function QuickReaction({
  emoji,
  index,
  isSelected,
  progress,
  onPress,
}: {
  emoji: ReactionEmoji
  index: number
  isSelected: boolean
  progress: SharedValue<number>
  onPress: (emoji: ReactionEmoji) => void
}): React.ReactElement {
  const staggeredStyle = useAnimatedStyle(() => {
    const start = index * 0.06
    return {
      transform: [
        {
          scale: interpolate(
            progress.value,
            [start, start + 0.5],
            [0.4, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    }
  })

  return (
    <Reanimated.View style={staggeredStyle}>
      <Stack
        role="button"
        width={REACTION_SIZE}
        height={REACTION_SIZE}
        borderRadius={REACTION_SIZE}
        alignItems="center"
        justifyContent="center"
        backgroundColor={isSelected ? '$backgroundHighlight' : undefined}
        pressStyle={{scale: 1.2}}
        onPress={() => {
          onPress(emoji)
        }}
      >
        <Typography variant="heading3" color="$foregroundPrimary">
          {emoji}
        </Typography>
      </Stack>
    </Reanimated.View>
  )
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
  const {
    messageActionsSelectionAtom,
    replyToMessageAtom,
    reactionsAtom,
    otherSideSupportsReactionsAtom,
    sendReactionAtom,
  } = useMolecule(chatMolecule)
  const [selection, setSelection] = useAtom(messageActionsSelectionAtom)
  const setReplyToMessage = useSetAtom(replyToMessageAtom)
  const reactions = useAtomValue(reactionsAtom)
  const otherSideSupportsReactions = useAtomValue(
    otherSideSupportsReactionsAtom
  )
  const sendReaction = useSetAtom(sendReactionAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const progress = useSharedValue(0)
  const bubbleScale = useSharedValue(PRESSED_BUBBLE_SCALE)
  const layout = selection?.layout
  const isMine = selection?.message.state !== 'received'
  const showReactions =
    otherSideSupportsReactions &&
    !!selection &&
    canReactToMessage(selection.message)
  const placement =
    layout &&
    computePlacement({
      layout,
      isMine,
      showReactions,
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
          <XStack
            p={REACTION_BAR_PADDING}
            borderRadius={REACTION_BAR_HEIGHT}
            backgroundColor="$backgroundOnBar"
            boxShadow={SURFACE_SHADOW}
          >
            {Array.map(QUICK_REACTIONS, (emoji, index) => (
              <QuickReaction
                key={emoji}
                emoji={emoji}
                index={index}
                isSelected={messageReactions?.mine === emoji}
                progress={progress}
                onPress={react}
              />
            ))}
          </XStack>
        </Reanimated.View>
      )}
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
