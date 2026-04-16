import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Copy,
  Typography,
  IconButton as UiIconButton,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {
  atom,
  useAtom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type SetStateAction,
} from 'jotai'
import {DateTime} from 'luxon'
import React, {useCallback, useMemo} from 'react'
import {
  Image,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native'
import Autolink from 'react-native-autolink'
import {Stack, Text, useTheme} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import {chatMolecule} from '../atoms'
import formatChatTime from '../utils/formatChatTime'
import {type MessagesListItem} from './MessageItem'

const style = StyleSheet.create({
  image: {
    width: '100%',
    height: 300,
  },
  replyImage: {
    width: '100%',
    height: 50,
  },
  link: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
})

// const textInputHitSlop = {top: 15, bottom: 15, left: 10, right: 10}

function useIsExtended(messageItem: MessagesListItem): {
  isExtended: boolean
  showExtended: () => void
  hideExtended: () => void
  toggleExtended: () => void
} {
  const {messageOptionsExtendedAtom} = useMolecule(chatMolecule)

  const thisMessageOptionsExtendedAtom = useMemo(
    () =>
      atom(
        (get) => {
          if (messageItem.type !== 'message') return false
          return (
            get(messageOptionsExtendedAtom)?.message?.uuid ===
            messageItem.message.message.uuid
          )
        },
        (get, set, setExtended?: SetStateAction<boolean>) => {
          if (messageItem.type !== 'message') return
          const nextState =
            setExtended !== undefined
              ? getValueFromSetStateActionOfAtom(setExtended)(() =>
                  get(thisMessageOptionsExtendedAtom)
                )
              : !get(thisMessageOptionsExtendedAtom)
          set(
            messageOptionsExtendedAtom,
            nextState ? messageItem.message : null
          )
        }
      ),
    [messageOptionsExtendedAtom, messageItem]
  )
  const [isExtended, setIsExtended] = useAtom(thisMessageOptionsExtendedAtom)
  return {
    isExtended,
    showExtended: useCallback(() => {
      setIsExtended(true)
    }, [setIsExtended]),
    hideExtended: useCallback(() => {
      setIsExtended(false)
    }, [setIsExtended]),
    toggleExtended: useCallback(() => {
      setIsExtended()
    }, [setIsExtended]),
  }
}

type messageTypesWithItalicPrefix =
  | 'REQUEST_MESSAGING'
  | 'CANCEL_REQUEST_MESSAGING'
  | 'DISAPPROVE_MESSAGING'
  | 'APPROVE_MESSAGING'
  | 'VERSION_UPDATE'

function shouldHaveItalicPrefix(
  messageType: string
): messageType is messageTypesWithItalicPrefix {
  return [
    'REQUEST_MESSAGING',
    'CANCEL_REQUEST_MESSAGING',
    'DISAPPROVE_MESSAGING',
    'APPROVE_MESSAGING',
    'VERSION_UPDATE',
  ].includes(messageType)
}

function TextMessage({
  messageAtom,
}: {
  messageAtom: Atom<MessagesListItem>
}): React.ReactElement | null {
  const theme = useTheme()
  const messageItem = useAtomValue(messageAtom)
  const {
    sendMessageAtom,
    replyToMessageAtom,
    otherSideDataAtom,
    lastMessageReadByOtherSideAtAtom,
  } = useMolecule(chatMolecule)
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const sendMessage = useSetAtom(sendMessageAtom)
  const lastMessageReadByOtherSideAt = useAtomValue(
    lastMessageReadByOtherSideAtAtom
  )
  const {t} = useTranslation()

  const {isExtended, hideExtended, toggleExtended} = useIsExtended(messageItem)
  const setReplyToMessage = useSetAtom(replyToMessageAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)

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
    setReplyToMessage(messageItem.message)
    hideExtended()
  }, [messageItem, setReplyToMessage, hideExtended])

  const onCopyPressed = useCallback(() => {
    if (messageItem.type !== 'message') return
    Clipboard.setString(messageItem.message.message.text)
    setToastNotification(t('common.copied'))
    hideExtended()
  }, [messageItem, setToastNotification, t, hideExtended])

  const onImagePressed = useCallback(() => {
    if (messageItem.type !== 'message') return
    if (!messageItem.message.message.image) return
    navigation.navigate('ChatImagePreview', {
      imageUri: resolveLocalUri(messageItem.message.message.image),
    })
  }, [messageItem, navigation])

  if (messageItem.type !== 'message') return null
  const {message, isLatest, time} = messageItem

  if (!message) return null
  if (message.state === 'receivedButRequiresNewerVersion') return null

  const isMine = message.state !== 'received'
  const messageTextColor = isMine ? '#000000' : theme.foregroundPrimary.val
  const messageBackgroundColor = isMine
    ? theme.accentYellowPrimary.val
    : theme.backgroundTertiary.val

  const messageText = message.message.text

  return (
    <TouchableWithoutFeedback onPress={hideExtended}>
      <Stack mx="$5" mt="$2" flex={1} alignItems="stretch">
        <XStack
          flex={1}
          flexDirection={!isMine ? 'row' : 'row-reverse'}
          gap="$2"
          alignItems="flex-end"
        >
          <TouchableWithoutFeedback style={{flex: 1}} onPress={toggleExtended}>
            <Stack
              width={message.message.image ? '80%' : undefined}
              maxWidth="80%"
              borderRadius="$6"
              backgroundColor={messageBackgroundColor}
              p="$4"
            >
              {!!message.message.repliedTo && (
                <YStack
                  borderRadius="$4"
                  padding="$3"
                  marginBottom="$2"
                  backgroundColor="$backgroundTertiary"
                >
                  {!!message.message.repliedTo.image && (
                    <Image
                      style={style.replyImage}
                      resizeMode="contain"
                      source={{
                        uri: resolveLocalUri(message.message.repliedTo.image),
                      }}
                    />
                  )}
                  <Typography
                    color={
                      isMine
                        ? '$accentHighlightSecondary'
                        : '$foregroundSecondary'
                    }
                    variant="micro"
                  >
                    {(message.state === 'received' &&
                      message.message.repliedTo.messageAuthor === 'them') ||
                    (message.state === 'sent' &&
                      message.message.repliedTo.messageAuthor === 'me')
                      ? t('common.you')
                      : (otherSideData?.userName ?? 'them')}
                  </Typography>
                  <Typography
                    color="$foregroundPrimary"
                    variant="description"
                    marginTop="$1"
                  >
                    {message.message.repliedTo.text}
                  </Typography>
                </YStack>
              )}
              {!!message.message.image && (
                <YStack
                  borderRadius="$4"
                  padding="$3"
                  marginBottom="$2"
                  backgroundColor="$backgroundTertiary"
                >
                  <TouchableWithoutFeedback onPress={onImagePressed}>
                    <Image
                      style={style.image}
                      resizeMode="contain"
                      source={{uri: resolveLocalUri(message.message.image)}}
                    />
                  </TouchableWithoutFeedback>
                </YStack>
              )}
              <Autolink
                text={messageText}
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
          </TouchableWithoutFeedback>
          {!!isExtended && (
            <XStack gap="$2" marginBottom="$1">
              <UiIconButton
                width="$9"
                height="$9"
                backgroundColor="$backgroundSecondary"
                onPress={onReplyPressed}
              >
                <Text color="$foregroundPrimary">↩</Text>
              </UiIconButton>
              <UiIconButton
                width="$9"
                height="$9"
                backgroundColor="$backgroundSecondary"
                onPress={onCopyPressed}
              >
                <Copy size={18} color={theme.foregroundPrimary.val} />
              </UiIconButton>
            </XStack>
          )}
          {message.state === 'sendingError' && (
            <Pressable onPress={onPressResend}>
              <Text
                userSelect="auto"
                textAlign={isMine ? 'right' : 'left'}
                mt="$1"
                mb="$2"
                color={
                  message.state === 'sendingError' ? '$red' : '$greyOnBlack'
                }
              >
                {toCommonErrorMessage(message.error, t) ??
                  t('common.somethingWentWrong')}{' '}
                {t('messages.tapToResent')}
              </Text>
            </Pressable>
          )}
        </XStack>
        {!!isLatest && (
          <Typography
            color={
              message.state === 'sendingError' ? '$red' : '$foregroundTertiary'
            }
            variant="micro"
            textAlign={isMine ? 'right' : 'left'}
            marginTop="$3"
          >
            {message.state === 'sending' && t('messages.sending')}
            {message.state === 'sent' &&
              !!lastMessageReadByOtherSideAt &&
              t('messages.readAt', {
                time: formatChatTime(
                  DateTime.fromMillis(lastMessageReadByOtherSideAt)
                ),
              })}
            {message.state === 'sent' &&
              !lastMessageReadByOtherSideAt &&
              formatChatTime(time)}
            {message.state === 'received' && formatChatTime(time)}
          </Typography>
        )}
      </Stack>
    </TouchableWithoutFeedback>
  )
}

export default TextMessage
