import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Send,
  Stack,
  Typography,
  IconButton as UiIconButton,
  XStack,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import truncate from 'just-truncate'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {TextInput as RNTextInput} from 'react-native'
import Animated, {
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {useTheme} from 'tamagui'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {version} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {checkNotificationPermissionsAndAskIfPossibleTEActionAtom} from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import UriImageWithSizeLimits from '../../UriImageWithSizeLimits'
import {chatMolecule} from '../atoms'
import {usePeriodicTypingIndication} from './usePeriodicTypingIndication'

const responseImagePreviewLimits = {width: 200, height: 100}
function ChatTextInput(): React.ReactElement | null {
  const theme = useTheme()
  const [value, setValue] = useState('')
  const {sendMessageAtom, replyToMessageAtom, otherSideDataAtom} =
    useMolecule(chatMolecule)
  const [replyToMessage, setReplyToMessage] = useAtom(replyToMessageAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const sendMessage = useSetAtom(sendMessageAtom)
  const session = useSessionAssumeLoggedIn()
  const {t} = useTranslation()
  const textInputRef = useRef<RNTextInput>(null)
  const checkNotificationsAndAskIfPossible = useSetAtom(
    checkNotificationPermissionsAndAskIfPossibleTEActionAtom
  )

  usePeriodicTypingIndication(!!value.trim())

  useEffect(() => {
    if (!replyToMessage) return
    textInputRef.current?.focus()
  }, [replyToMessage])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      marginRight: 5,
      opacity: withSpring(value ? 1 : 0),
    }
  }, [value])

  const sendText = useCallback(() => {
    if (!value.trim()) return

    const message: ChatMessage = {
      text: value,
      myVersion: version,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      repliedTo: replyToMessage
        ? {
            text: truncate(replyToMessage.message.text, 100, '...'),
            messageAuthor: replyToMessage.state === 'received' ? 'them' : 'me',
            image: replyToMessage.message.image,
          }
        : undefined,
      messageType: 'MESSAGE',
      senderPublicKey: session.privateKey.publicKeyPemBase64,
    }
    setValue('')
    setReplyToMessage(undefined)

    void sendMessage(message)
    void checkNotificationsAndAskIfPossible()()
  }, [
    value,
    replyToMessage,
    session.privateKey.publicKeyPemBase64,
    setReplyToMessage,
    sendMessage,
    checkNotificationsAndAskIfPossible,
  ])

  const inputStyles = useMemo(
    () => ({
      minHeight: 21,
      maxHeight: 110,
      paddingVertical: 0,
      paddingHorizontal: 0,
      color: theme.foregroundPrimary.get(),
      fontFamily: 'TTSatoshi500',
      fontSize: 16,
    }),
    [theme]
  )

  return (
    <YStack>
      {!!replyToMessage && (
        <Animated.View
          entering={SlideInDown.duration(180)}
          exiting={SlideOutDown.duration(180)}
          style={{overflow: 'hidden'}}
        >
          <XStack
            backgroundColor="$backgroundSecondary"
            pt="$3"
            pb="$3"
            px="$6"
            justifyContent="space-between"
            alignItems="center"
            gap="$2"
          >
            <YStack flex={1} gap="$2">
              {!!replyToMessage.message.image && (
                <UriImageWithSizeLimits
                  uri={replyToMessage.message.image}
                  limits={responseImagePreviewLimits}
                />
              )}
              <Typography color="$foregroundSecondary" variant="micro">
                {t('common.replyTo')}
              </Typography>
              <Typography
                color="$foregroundPrimary"
                variant="description"
                marginTop="$1"
              >
                {truncate(replyToMessage.message.text, 100, '...')}
              </Typography>
            </YStack>
            <UiIconButton
              width="$9"
              height="$9"
              borderRadius="$3"
              backgroundColor="transparent"
              onPress={() => {
                setReplyToMessage(undefined)
              }}
            >
              <XmarkCancelClose
                size={20}
                color={theme.foregroundSecondary.get()}
              />
            </UiIconButton>
          </XStack>
        </Animated.View>
      )}
      <XStack
        backgroundColor="$backgroundSecondary"
        gap="$3"
        alignItems="flex-end"
      >
        <Stack flex={1}>
          <XStack
            alignItems="center"
            gap="$3"
            my="$3"
            mx="$4"
            px="$6"
            py="$3"
            borderRadius="$9"
            backgroundColor="$backgroundOnBar"
          >
            <Stack flex={1} justifyContent="center">
              <RNTextInput
                ref={textInputRef}
                multiline
                value={value}
                onChangeText={setValue}
                style={inputStyles}
                placeholder={t('messages.typeSomething')}
                placeholderTextColor={theme.foregroundTertiary.get()}
                selectionColor={theme.accentHighlightPrimary.get()}
              />
            </Stack>
            <Animated.View style={animatedStyle}>
              <UiIconButton
                width="$9"
                height="$9"
                borderRadius="$3"
                backgroundColor="$accentYellowSecondary"
                onPress={sendText}
              >
                <Send size={20} color={theme.accentHighlightPrimary.get()} />
              </UiIconButton>
            </Animated.View>
          </XStack>
        </Stack>
      </XStack>
    </YStack>
  )
}

export default ChatTextInput
