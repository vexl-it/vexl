import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Button,
  ChatBubble,
  Rejected,
  Reply,
  Stack,
  Typography,
  useTheme,
  XStack,
  YStack,
  type ChatBubbleRenderTextArgs,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import Autolink from 'react-native-autolink'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {globalDialogAtom} from '../../GlobalDialog'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import {chatMolecule} from '../atoms'
import {LastMessageTime} from './LastMessageTime'
import {type MessagesListItem} from './MessageItem'
import TextMessageActionMenu, {
  type MessageBubbleLayout,
} from './TextMessageActionMenu'

const imageHeight = 300
const replyImageHeight = 50
const messagePopScale = 1.04
const messagePopAnimationDuration = 120
const replySwipeActionOffset = 56
const replySwipeActivationDistance = 72
const replySwipeMaxOffset = 88
const replySwipeSpringConfig = {
  damping: 18,
  mass: 0.7,
  stiffness: 180,
}

const style = StyleSheet.create({
  image: {
    width: '100%',
    height: imageHeight,
  },
  replyImage: {
    width: '100%',
    height: replyImageHeight,
  },
  link: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
})

const renderLinkifiedText = ({
  text,
  color,
}: ChatBubbleRenderTextArgs): React.ReactNode => (
  <Autolink
    text={text}
    url
    linkStyle={[
      style.link,
      {
        color,
        fontSize: 18,
        fontFamily: 'TTSatoshi500',
      },
    ]}
    style={{
      color,
      fontSize: 18,
      lineHeight: 24,
      fontFamily: 'TTSatoshi500',
    }}
  />
)

function MessageBubble({
  isMine,
  message,
  onImagePressed,
}: {
  isMine: boolean
  message: ChatMessageWithState
  onImagePressed?: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const repliedToMessage =
    'repliedTo' in message.message ? message.message.repliedTo : undefined
  const {messageType, image} = message.message

  return (
    <ChatBubble
      variant={isMine ? 'outgoing' : 'incoming'}
      text={message.message.text}
      renderText={renderLinkifiedText}
      quote={
        repliedToMessage
          ? {
              label: t('common.replyTo'),
              text: repliedToMessage.text,
              image: repliedToMessage.image ? (
                <Image
                  style={style.replyImage}
                  resizeMode="contain"
                  source={{uri: resolveLocalUri(repliedToMessage.image)}}
                />
              ) : undefined,
            }
          : undefined
      }
      notice={
        messageType === 'REQUEST_MESSAGING'
          ? t('messages.requestedWith')
          : messageType === 'DISAPPROVE_MESSAGING'
            ? t('messages.declinedWith')
            : undefined
      }
      image={
        image ? (
          <TouchableWithoutFeedback
            disabled={!onImagePressed}
            onPress={onImagePressed}
          >
            <Image
              style={style.image}
              resizeMode="contain"
              source={{uri: resolveLocalUri(image)}}
            />
          </TouchableWithoutFeedback>
        ) : undefined
      }
    />
  )
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
    lastMessageReadByOtherSideAtAtom,
  } = useMolecule(chatMolecule)
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const bubbleRef = useRef<View>(null)
  const messageBubbleScale = useRef(new Animated.Value(1)).current
  const openActionMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const swipeTranslateX = useSharedValue(0)
  const shouldTriggerReplyFromSwipe = useSharedValue(false)
  const pendingActionAfterCloseRef = useRef<(() => void) | null>(null)
  const sendMessage = useSetAtom(sendMessageAtom)
  const lastMessageReadByOtherSideAt = useAtomValue(
    lastMessageReadByOtherSideAtAtom
  )
  const showGlobalDialog = useSetAtom(globalDialogAtom)
  const {t} = useTranslation()
  const [messageBubbleLayout, setMessageBubbleLayout] =
    useState<MessageBubbleLayout | null>(null)
  const [isClosingActionMenu, setIsClosingActionMenu] = useState(false)
  const setReplyToMessage = useSetAtom(replyToMessageAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)

  useEffect(() => {
    return () => {
      if (openActionMenuTimeoutRef.current !== null) {
        clearTimeout(openActionMenuTimeoutRef.current)
      }
      pendingActionAfterCloseRef.current = null
    }
  }, [])

  const finishCloseMessageActionMenu = useCallback(() => {
    const pendingAction = pendingActionAfterCloseRef.current
    pendingActionAfterCloseRef.current = null
    if (openActionMenuTimeoutRef.current !== null) {
      clearTimeout(openActionMenuTimeoutRef.current)
      openActionMenuTimeoutRef.current = null
    }
    setIsClosingActionMenu(false)
    setMessageBubbleLayout(null)
    Animated.spring(messageBubbleScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start()
    pendingAction?.()
  }, [messageBubbleScale])

  const requestCloseMessageActionMenu = useCallback(() => {
    if (openActionMenuTimeoutRef.current !== null) {
      clearTimeout(openActionMenuTimeoutRef.current)
      openActionMenuTimeoutRef.current = null
    }
    if (messageBubbleLayout === null || isClosingActionMenu) return
    setIsClosingActionMenu(true)
  }, [isClosingActionMenu, messageBubbleLayout])

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

  const onReplyPressed = useCallback(() => {
    if (messageItem.type !== 'message') return
    pendingActionAfterCloseRef.current = () => {
      setReplyToMessage(messageItem.message)
    }
    requestCloseMessageActionMenu()
  }, [messageItem, requestCloseMessageActionMenu, setReplyToMessage])

  const onReplySwipeTriggered = useCallback(() => {
    if (messageItem.type !== 'message') return
    setReplyToMessage(messageItem.message)
  }, [messageItem, setReplyToMessage])

  const onCopyPressed = useCallback(() => {
    if (messageItem.type !== 'message') return
    Clipboard.setString(messageItem.message.message.text)
    setToastNotification(t('common.copied'))
    requestCloseMessageActionMenu()
  }, [messageItem, requestCloseMessageActionMenu, setToastNotification, t])

  const onImagePressed = useCallback(() => {
    if (messageItem.type !== 'message') return
    if (!messageItem.message.message.image) return
    navigation.navigate('ChatImagePreview', {
      imageUri: resolveLocalUri(messageItem.message.message.image),
    })
  }, [messageItem, navigation])

  const onLongPressMessage = useCallback(() => {
    if (messageBubbleLayout !== null) return

    Animated.spring(messageBubbleScale, {
      toValue: messagePopScale,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start()
    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      if (width === 0 || height === 0) return
      openActionMenuTimeoutRef.current = setTimeout(() => {
        setIsClosingActionMenu(false)
        setMessageBubbleLayout({x, y, width, height})
        openActionMenuTimeoutRef.current = null
      }, messagePopAnimationDuration)
    })
  }, [messageBubbleLayout, messageBubbleScale])

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
        scheduleOnRN(onReplySwipeTriggered)
      }
      shouldTriggerReplyFromSwipe.value = false
      swipeTranslateX.value = withSpring(0, replySwipeSpringConfig)
    })
    .onFinalize(() => {
      shouldTriggerReplyFromSwipe.value = false
      swipeTranslateX.value = withSpring(0, replySwipeSpringConfig)
    })

  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: swipeTranslateX.value}],
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
  const {message, isLatest, time} = messageItem

  if (!message) return null
  if (message.state === 'receivedButRequiresNewerVersion') return null

  const isMine = message.state !== 'received'
  const messageBubble = (
    <MessageBubble
      isMine={isMine}
      message={message}
      onImagePressed={onImagePressed}
    />
  )

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
              {!!false && (
                <Typography
                  color={
                    message.state === 'sendingError'
                      ? '$redForeground'
                      : '$foregroundSecondary'
                  }
                  variant="description"
                  textAlign={isMine ? 'right' : 'left'}
                  marginTop="$1"
                  marginBottom="$2"
                >
                  {toCommonErrorMessage(message.error, t) ??
                    t('common.somethingWentWrong')}{' '}
                  {t('messages.tapToResent')}
                </Typography>
              )}
            </Pressable>
          )}
          <View
            ref={bubbleRef}
            style={{
              width: message.message.image ? '80%' : undefined,
              maxWidth: '80%',
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
              <GestureDetector gesture={swipeToReplyGesture}>
                <Reanimated.View style={swipeAnimatedStyle}>
                  <Pressable
                    delayLongPress={250}
                    onLongPress={onLongPressMessage}
                  >
                    <Animated.View
                      style={{
                        transform: [{scale: messageBubbleScale}],
                      }}
                    >
                      {messageBubble}
                    </Animated.View>
                  </Pressable>
                </Reanimated.View>
              </GestureDetector>
            </Stack>
          </View>
        </XStack>
      </Stack>
      {!!isLatest && hideLastMessageTime !== true && (
        <LastMessageTime message={message} />
      )}
      <TextMessageActionMenu
        bubble={messageBubble}
        bubbleLayout={messageBubbleLayout}
        copyLabel={t('common.copy')}
        isClosing={isClosingActionMenu}
        isMine={isMine}
        onClose={requestCloseMessageActionMenu}
        onCloseComplete={finishCloseMessageActionMenu}
        onCopy={onCopyPressed}
        onReply={onReplyPressed}
        replyLabel={t('common.reply')}
      />
    </>
  )
}

export default TextMessage
