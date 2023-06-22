import {Stack, Text, XStack, YStack} from 'tamagui'
import Clipboard from '@react-native-clipboard/clipboard'
import React, {useCallback, useMemo} from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {
  atom,
  type Atom,
  type SetStateAction,
  useAtom,
  useAtomValue,
  useSetAtom,
} from 'jotai'
import {chatTime, type MessagesListItem} from '../utils'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {Pressable, TouchableWithoutFeedback} from 'react-native'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import replyToSvg from '../images/replyToSvg'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import copySvg from '../images/copySvg'
import IconButton from '../../IconButton'

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

function TextMessage({
  messageAtom,
}: {
  messageAtom: Atom<MessagesListItem>
}): JSX.Element | null {
  const messageItem = useAtomValue(messageAtom)
  const {sendMessageAtom, replyToMessageAtom, otherSideDataAtom} =
    useMolecule(chatMolecule)
  const sendMessage = useSetAtom(sendMessageAtom)
  const {t} = useTranslation()

  const {isExtended, hideExtended, toggleExtended} = useIsExtended(messageItem)
  const setReplyToMessage = useSetAtom(replyToMessageAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)

  const onPressResend = useCallback(() => {
    if (
      messageItem.type === 'message' &&
      messageItem.message.state === 'sendingError'
    ) {
      void sendMessage({
        ...messageItem.message.message,
        time: unixMillisecondsNow(),
      })()
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

  if (messageItem.type !== 'message') return null
  const {message, isLatest, time} = messageItem

  if (!message) return null

  const isMine = message.state !== 'received'

  return (
    <TouchableWithoutFeedback onPress={hideExtended}>
      <Stack mx={'$4'} mt={'$1'} flex={1} alignItems={'stretch'}>
        <XStack
          flex={1}
          flexDirection={!isMine ? 'row' : 'row-reverse'}
          space={'$2'}
          alignItems={'center'}
        >
          <TouchableWithoutFeedback
            style={{flex: 1}}
            onPress={hideExtended}
            onLongPress={toggleExtended}
          >
            <Stack
              maxWidth={'80%'}
              br={'$6'}
              backgroundColor={isMine ? '$main' : '$grey'}
              p={'$3'}
            >
              {message.message.repliedTo && (
                <YStack
                  borderRadius="$5"
                  padding="$3"
                  backgroundColor="$yellowAccent2"
                >
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
              <Text
                selectable
                fos={16}
                fontFamily={'$body500'}
                color={isMine ? '$black' : '$white'}
              >
                {message.message.text}
              </Text>
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
              chatTime(time)}
          </Text>
        )}
      </Stack>
    </TouchableWithoutFeedback>
  )
}

export default TextMessage
