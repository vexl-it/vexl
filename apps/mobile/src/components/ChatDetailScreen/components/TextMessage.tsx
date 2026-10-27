import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Button,
  Rejected,
  Reply,
  Stack,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import React, {useCallback, useMemo} from 'react'
import {Pressable, View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Reanimated, {
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {globalDialogAtom} from '../../GlobalDialog'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import {chatMolecule, type MessageLayout} from '../atoms'
import {LastMessageTime} from './LastMessageTime'
import MessageBubble, {PRESSED_BUBBLE_SCALE} from './MessageBubble'
import {type MessagesListItem} from './MessageItem'

const longPressDurationMs = 350
const pressFeedbackDelayMs = 100
const replySwipeActionOffset = 56
const replySwipeActivationDistance = 72
const replySwipeMaxOffset = 88
const replySwipeSpringConfig = {
  damping: 18,
  mass: 0.7,
  stiffness: 180,
}

function TextMessage({
  messageAtom,
  hideLastMessageTime,
}: {
  messageAtom: Atom<MessagesListItem>
  hideLastMessageTime?: boolean
}): React.ReactElement | null {
  const theme = useTheme()
  const messageItem = useAtomValue(messageAtom)
  const {
    sendMessageAtom,
    replyToMessageAtom,
    messageActionsSelectionAtom,
    reactionsAtom,
  } = useMolecule(chatMolecule)
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const bubbleRef = useAnimatedRef<Reanimated.View>()
  const bubbleLayout = useSharedValue<MessageLayout | null>(null)
  const pressScale = useSharedValue(1)
  const swipeTranslateX = useSharedValue(0)
  const shouldTriggerReplyFromSwipe = useSharedValue(false)
  const sendMessage = useSetAtom(sendMessageAtom)
  const showGlobalDialog = useSetAtom(globalDialogAtom)
  const {t} = useTranslation()
  const setReplyToMessage = useSetAtom(replyToMessageAtom)
  const setMessageActionsSelection = useSetAtom(messageActionsSelectionAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const messageUuid =
    messageItem.type === 'message' ? messageItem.message.message.uuid : null
  const isShownInActionsOverlay = useAtomValue(
    useMemo(
      () =>
        selectAtom(
          messageActionsSelectionAtom,
          (selection) => selection?.message.message.uuid === messageUuid
        ),
      [messageActionsSelectionAtom, messageUuid]
    )
  )
  const reactions = useAtomValue(
    useMemo(
      () =>
        selectAtom(reactionsAtom, (all) =>
          messageUuid ? all[messageUuid] : undefined
        ),
      [reactionsAtom, messageUuid]
    )
  )

  const resendMessage = useCallback(() => {
    if (
      messageItem.type === 'message' &&
      messageItem.message.state === 'sendingError'
    ) {
      sendMessage({
        ...messageItem.message.message,
        time: unixMillisecondsNow(),
      })
    }
  }, [sendMessage, messageItem])

  const replyToThisMessage = useCallback(() => {
    if (messageItem.type !== 'message') return
    setReplyToMessage(messageItem.message)
  }, [messageItem, setReplyToMessage])

  const openMessageActions = useCallback(
    (layout: MessageLayout) => {
      if (messageItem.type !== 'message') return
      setMessageActionsSelection({message: messageItem.message, layout})
    },
    [messageItem, setMessageActionsSelection]
  )

  const onImagePressed = useCallback(() => {
    if (messageItem.type !== 'message') return
    if (!messageItem.message.message.image) return
    navigation.navigate('ChatImagePreview', {
      imageUri: resolveLocalUri(messageItem.message.message.image),
    })
  }, [messageItem, navigation])

  const longPressGesture = Gesture.LongPress()
    .minDuration(longPressDurationMs)
    .onBegin(() => {
      // Measure before the press feedback scales the bubble down.
      const measured = measure(bubbleRef)
      bubbleLayout.value = measured && {
        x: measured.pageX,
        y: measured.pageY,
        width: measured.width,
        height: measured.height,
      }
      pressScale.value = withDelay(
        pressFeedbackDelayMs,
        withTiming(PRESSED_BUBBLE_SCALE, {
          duration: longPressDurationMs - pressFeedbackDelayMs,
        })
      )
    })
    .onStart(() => {
      if (bubbleLayout.value)
        scheduleOnRN(openMessageActions, bubbleLayout.value)
    })
    .onFinalize(() => {
      pressScale.value = withSpring(1)
    })

  const swipeToReplyGesture = Gesture.Pan()
    .activeOffsetX(12)
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      const nextTranslateX = Math.min(
        Math.max(event.translationX, 0),
        replySwipeMaxOffset
      )
      swipeTranslateX.value = nextTranslateX
      shouldTriggerReplyFromSwipe.value =
        event.translationX >= replySwipeActivationDistance
    })
    .onEnd(() => {
      if (shouldTriggerReplyFromSwipe.value) {
        scheduleOnRN(replyToThisMessage)
      }
      shouldTriggerReplyFromSwipe.value = false
      swipeTranslateX.value = withSpring(0, replySwipeSpringConfig)
    })
    .onFinalize(() => {
      shouldTriggerReplyFromSwipe.value = false
      swipeTranslateX.value = withSpring(0, replySwipeSpringConfig)
    })

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: swipeTranslateX.value}, {scale: pressScale.value}],
  }))

  const swipeReplyIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(
      Math.abs(swipeTranslateX.value) / replySwipeActionOffset,
      1
    ),
    transform: [
      {
        scale: Math.min(
          0.85 + Math.abs(swipeTranslateX.value) / replySwipeActionOffset / 5,
          1.05
        ),
      },
    ],
  }))

  const onPressResend = useCallback(() => {
    if (messageItem.type !== 'message') return
    if (messageItem.message.state !== 'sendingError') return
    const message = messageItem.message

    const errorMessage = toCommonErrorMessage(message.error, t, true)

    Effect.runFork(
      showGlobalDialog({
        title: t('messages.errorSendingMessage.title'),
        children: (
          <YStack gap="$5">
            <Typography color="$foregroundPrimary" variant="description">
              {t('messages.errorSendingMessage.description')}
            </Typography>
            {!!errorMessage && (
              <Typography color="$foregroundPrimary" variant="description">
                {errorMessage}
              </Typography>
            )}
            <Button
              variant="secondary"
              size="small"
              onPress={() => {
                Clipboard.setString(JSON.stringify(message.error, null, 2))
                setToastNotification(t('common.copied'))
              }}
            >
              {t('common.copyErrorToClipboard')}
            </Button>
          </YStack>
        ),
        positiveButtonText: t('messages.errorSendingMessage.resend'),
        negativeButtonText: t('common.cancel'),
      }).pipe(
        Effect.flatMap((a) => {
          if (a) resendMessage()
          return Effect.void
        })
      )
    )
  }, [messageItem, showGlobalDialog, setToastNotification, t, resendMessage])

  if (messageItem.type !== 'message') return null
  const {message, isLatest} = messageItem

  if (!message) return null
  if (message.state === 'receivedButRequiresNewerVersion') return null

  const isMine = message.state !== 'received'

  return (
    <>
      <Stack mx="$5" mt="$2" flex={1} alignItems="stretch">
        <XStack
          flex={1}
          flexDirection={!isMine ? 'row' : 'row-reverse'}
          gap="$2"
          alignItems="flex-end"
        >
          {message.state === 'sendingError' && (
            <Pressable style={{alignSelf: 'flex-end'}} onPress={onPressResend}>
              <Rejected color={theme.redForeground.get()} size={24} />
            </Pressable>
          )}
          <View
            style={{
              width: message.message.image ? '80%' : undefined,
              maxWidth: '80%',
              opacity: isShownInActionsOverlay ? 0 : 1,
            }}
          >
            <Stack justifyContent="center">
              <Reanimated.View
                pointerEvents="none"
                style={[
                  {
                    position: 'absolute',
                    left: 0,
                    width: replySwipeActionOffset,
                    alignItems: 'center',
                  },
                  swipeReplyIconAnimatedStyle,
                ]}
              >
                <Stack
                  width="$9"
                  height="$9"
                  borderRadius="$9"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="$backgroundSecondary"
                >
                  <Reply size={18} color={theme.foregroundPrimary.get()} />
                </Stack>
              </Reanimated.View>
              <GestureDetector
                gesture={Gesture.Race(swipeToReplyGesture, longPressGesture)}
              >
                <Reanimated.View ref={bubbleRef} style={bubbleAnimatedStyle}>
                  <MessageBubble
                    message={message}
                    reactions={reactions}
                    onImagePressed={onImagePressed}
                  />
                </Reanimated.View>
              </GestureDetector>
            </Stack>
          </View>
        </XStack>
      </Stack>
      {!!isLatest && hideLastMessageTime !== true && (
        <LastMessageTime message={message} />
      )}
    </>
  )
}

export default TextMessage
