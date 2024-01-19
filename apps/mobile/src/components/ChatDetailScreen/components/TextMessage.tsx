import Clipboard from '@react-native-clipboard/clipboard'
import {type ChatMessage} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  atom,
  useAtom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type SetStateAction,
} from 'jotai'
import {useMolecule} from 'bunshi/dist/react'
import React, {useCallback, useMemo} from 'react'
import {
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import IconButton from '../../IconButton'
import {chatMolecule} from '../atoms'
import copySvg from '../images/copySvg'
import replyToSvg from '../images/replyToSvg'
import formatChatTime from '../utils/formatChatTime'
import {type MessagesListItem} from './MessageItem'

const style = StyleSheet.create({
  textInputStyle: {
    fontSize: 16,
    fontFamily: 'TTSatoshi500',
    margin: 0,
    padding: 0,
  },
  image: {
    width: '100%',
    height: 300,
  },
  replyImage: {
    width: '100%',
    height: 50,
  },
})

const textInputHitSlop = {top: 15, bottom: 15, left: 10, right: 10}

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

function shouldHaveItalicPrefix(
  messageType: string
): messageType is messageTypesWithItalicPrefix {
  return [
    'REQUEST_MESSAGING',
    'CANCEL_REQUEST_MESSAGING',
    'DISAPPROVE_MESSAGING',
    'APPROVE_MESSAGING',
  ].includes(messageType)
}

function TextMessageAccent({
  message,
  isMine,
}: {
  message: ChatMessage
  isMine: boolean
}): JSX.Element {
  const {t} = useTranslation()

  if (shouldHaveItalicPrefix(message.messageType)) {
    return (
      <Text color={isMine ? '$black' : '$white'} fontStyle="italic">
        {t(`messages.textMessageTypes.${message.messageType}`, {
          message: message.text,
        })}
      </Text>
    )
  }

  return <>{message.text}</>
}

function TextMessage({
  messageAtom,
}: {
  messageAtom: Atom<MessagesListItem>
}): JSX.Element | null {
  const tokens = getTokens()
  const messageItem = useAtomValue(messageAtom)
  const {
    sendMessageAtom,
    replyToMessageAtom,
    otherSideDataAtom,
    openedImageUriAtom,
  } = useMolecule(chatMolecule)
  const sendMessage = useSetAtom(sendMessageAtom)
  const {t} = useTranslation()

  const {isExtended, hideExtended, toggleExtended} = useIsExtended(messageItem)
  const setReplyToMessage = useSetAtom(replyToMessageAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const openImage = useSetAtom(openedImageUriAtom)

  const textInputStyle = useMemo(
    () => [
      style.textInputStyle,
      {
        color:
          messageItem.type === 'message' &&
          messageItem.message.state !== 'received'
            ? tokens.color.black.val
            : tokens.color.white.val,
      },
    ],
    [messageItem, tokens.color.black.val, tokens.color.white.val]
  )

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
    hideExtended()
  }, [messageItem, hideExtended])

  const onImagePressed = useCallback(() => {
    if (messageItem.type !== 'message') return
    openImage(messageItem.message.message.image)
  }, [messageItem, openImage])

  if (messageItem.type !== 'message') return null
  const {message, isLatest, time} = messageItem

  if (!message) return null
  if (message.state === 'receivedButRequiresNewerVersion') return null

  const isMine = message.state !== 'received'

  return (
    <TouchableWithoutFeedback onPress={hideExtended}>
      <Stack mx="$4" mt="$1" flex={1} alignItems="stretch">
        <XStack
          flex={1}
          flexDirection={!isMine ? 'row' : 'row-reverse'}
          space="$2"
          alignItems="center"
        >
          <TouchableWithoutFeedback style={{flex: 1}} onPress={toggleExtended}>
            <Stack
              width={message.message.image ? '80%' : undefined}
              maxWidth="80%"
              br="$6"
              backgroundColor={isMine ? '$main' : '$grey'}
              p="$3"
            >
              {message.message.repliedTo && (
                <YStack
                  borderRadius="$5"
                  padding="$3"
                  backgroundColor="$yellowAccent2"
                >
                  {message.message.repliedTo.image && (
                    <Image
                      style={style.replyImage}
                      resizeMode="contain"
                      source={{
                        uri: resolveLocalUri(message.message.repliedTo.image),
                      }}
                    />
                  )}
                  <Text fontSize={12} color="$main">
                    {(message.state === 'received' &&
                      message.message.repliedTo.messageAuthor === 'them') ||
                    (message.state === 'sent' &&
                      message.message.repliedTo.messageAuthor === 'me')
                      ? t('common.you')
                      : otherSideData?.userName ?? 'them'}
                  </Text>
                  <Text marginTop="$1" color="$main">
                    {message.message.repliedTo.text}
                  </Text>
                </YStack>
              )}
              {message.message.image && (
                <YStack
                  borderRadius="$5"
                  padding="$3"
                  backgroundColor="$yellowAccent2"
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
              {isExtended ? (
                <TextInput
                  caretHidden
                  multiline
                  hitSlop={textInputHitSlop}
                  showSoftInputOnFocus={false}
                  spellCheck={false}
                  style={textInputStyle}
                >
                  <TextMessageAccent
                    isMine={isMine}
                    message={message.message}
                  />
                </TextInput>
              ) : (
                <Text
                  selectable
                  fos={16}
                  fontFamily="$body500"
                  color={isMine ? '$black' : '$white'}
                >
                  <TextMessageAccent
                    isMine={isMine}
                    message={message.message}
                  />
                </Text>
              )}
            </Stack>
          </TouchableWithoutFeedback>
          {isExtended && (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <XStack>
                <IconButton
                  icon={replyToSvg}
                  onPress={onReplyPressed}
                  variant="plain"
                />
                <IconButton
                  icon={copySvg}
                  onPress={onCopyPressed}
                  variant="plain"
                  iconFill={getTokens().color.white.val}
                />
              </XStack>
            </Animated.View>
          )}
          {message.state === 'sendingError' && (
            <Pressable onPress={onPressResend}>
              <Text
                selectable
                textAlign={isMine ? 'right' : 'left'}
                mt="$1"
                mb="$2"
                color={
                  message.state === 'sendingError' ? '$red' : '$greyOnBlack'
                }
              >
                {toCommonErrorMessage(message.error, t) ??
                  t('common.unknownError')}{' '}
                {t('messages.tapToResent')}
              </Text>
            </Pressable>
          )}
        </XStack>
        {isLatest && (
          <Text
            selectable
            textAlign={isMine ? 'right' : 'left'}
            mt="$1"
            mb="$2"
            color={message.state === 'sendingError' ? '$red' : '$greyOnBlack'}
          >
            {message.state === 'sending' && t('messages.sending')}
            {(message.state === 'sent' || message.state === 'received') &&
              formatChatTime(time)}
          </Text>
        )}
      </Stack>
    </TouchableWithoutFeedback>
  )
}

export default TextMessage
