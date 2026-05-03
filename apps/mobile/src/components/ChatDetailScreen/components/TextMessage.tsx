import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Stack,
  tokens,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
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
import {type RootStackScreenProps} from '../../../navigationTypes'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
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

function MessageBubble({
  isMine,
  messageAuthorName,
  message,
  messageBackgroundColor,
  messageTextColor,
  onImagePressed,
}: {
  isMine: boolean
  messageAuthorName: string
  message: ChatMessageWithState
  messageBackgroundColor: string
  messageTextColor: string
  onImagePressed?: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const repliedToMessage =
    'repliedTo' in message.message ? message.message.repliedTo : undefined

  const isSpecialMessage =
    message.message.messageType === 'REQUEST_MESSAGING' ||
    message.message.messageType === 'DISAPPROVE_MESSAGING'

  return (
    <Stack>
      {!!repliedToMessage && (
        <XStack
          borderRadius="$5"
          marginBottom="$0.5"
          borderBottomLeftRadius="$2"
          borderBottomRightRadius="$2"
          backgroundColor={
            isMine ? '$accentYellowSecondary' : '$backgroundSecondary'
          }
          padding="$4"
          paddingBottom="$3"
          paddingTop="$4"
          gap="$2"
        >
          <YStack gap="$1">
            {!!repliedToMessage.image && (
              <Image
                style={style.replyImage}
                resizeMode="contain"
                source={{
                  uri: resolveLocalUri(repliedToMessage.image),
                }}
              />
            )}
            <Typography color="$foregroundSecondary" variant="micro">
              {t('common.replyTo')}
            </Typography>
            <Typography
              color="$foregroundPrimary"
              variant="micro"
              marginTop="$1"
            >
              {repliedToMessage.text}
            </Typography>
          </YStack>
        </XStack>
      )}
      {!!isSpecialMessage && (
        <XStack
          borderRadius="$5"
          marginBottom="$0.5"
          borderBottomLeftRadius="$2"
          borderBottomRightRadius="$2"
          backgroundColor={
            isMine ? '$accentYellowSecondary' : '$backgroundSecondary'
          }
          padding="$4"
          paddingBottom="$3"
          paddingTop="$4"
          gap="$2"
        >
          <Typography color="$foregroundSecondary" variant="micro">
            {message.message.messageType === 'REQUEST_MESSAGING'
              ? t('messages.requestedWith')
              : t('messages.declinedWith')}
          </Typography>
        </XStack>
      )}
      {!!message.message.image && (
        <YStack
          borderRadius="$4"
          padding="$3"
          marginBottom="$2"
          backgroundColor="$backgroundTertiary"
        >
          <TouchableWithoutFeedback
            disabled={!onImagePressed}
            onPress={onImagePressed}
          >
            <Image
              style={style.image}
              resizeMode="contain"
              source={{uri: resolveLocalUri(message.message.image)}}
            />
          </TouchableWithoutFeedback>
        </YStack>
      )}
      <Stack
        borderRadius="$6"
        borderTopLeftRadius={repliedToMessage || isSpecialMessage ? '$2' : '$6'}
        borderTopRightRadius={
          repliedToMessage || isSpecialMessage ? '$2' : '$6'
        }
        backgroundColor={messageBackgroundColor}
        px="$4"
        pb="$4"
        pt="$4"
      >
        <Autolink
          text={message.message.text}
          url
          linkStyle={[
            style.link,
            {
              color: messageTextColor,
              fontSize: 18,
              fontFamily: 'TTSatoshi500',
            },
          ]}
          style={{
            color: messageTextColor,
            fontSize: 18,
            lineHeight: 24,
            fontFamily: 'TTSatoshi500',
          }}
        />
      </Stack>
    </Stack>
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
  const pendingActionAfterCloseRef = useRef<(() => void) | null>(null)
  const sendMessage = useSetAtom(sendMessageAtom)
  const lastMessageReadByOtherSideAt = useAtomValue(
    lastMessageReadByOtherSideAtAtom
  )
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

  const onPressResend = useCallback(() => {
    if (
      messageItem.type === 'message' &&
      messageItem.message.state === 'sendingError'
    ) {
      void sendMessage({
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

  if (messageItem.type !== 'message') return null
  const {message, isLatest, time} = messageItem

  if (!message) return null
  if (message.state === 'receivedButRequiresNewerVersion') return null

  const isMine = message.state !== 'received'
  const messageTextColor = isMine
    ? tokens.color.black100.val
    : theme.foregroundPrimary.val
  const messageBackgroundColor = isMine
    ? theme.accentYellowPrimary.val
    : theme.backgroundTertiary.val
  const repliedToMessage =
    'repliedTo' in message.message ? message.message.repliedTo : undefined
  const repliedMessageAuthorName =
    (message.state === 'received' &&
      repliedToMessage?.messageAuthor === 'them') ||
    (message.state === 'sent' && repliedToMessage?.messageAuthor === 'me')
      ? t('common.you')
      : t('common.otherSide')
  const messageBubble = (
    <MessageBubble
      isMine={isMine}
      messageAuthorName={repliedMessageAuthorName}
      message={message}
      messageBackgroundColor={messageBackgroundColor}
      messageTextColor={messageTextColor}
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
          <View
            ref={bubbleRef}
            style={{
              width: message.message.image ? '80%' : undefined,
              maxWidth: '80%',
            }}
          >
            <Pressable delayLongPress={250} onLongPress={onLongPressMessage}>
              <Animated.View
                style={{
                  transform: [{scale: messageBubbleScale}],
                }}
              >
                {messageBubble}
              </Animated.View>
            </Pressable>
          </View>
          {message.state === 'sendingError' && (
            <Pressable onPress={onPressResend}>
              <Typography
                color={
                  message.state === 'sendingError' ? '$red' : '$greyOnBlack'
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
            </Pressable>
          )}
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
