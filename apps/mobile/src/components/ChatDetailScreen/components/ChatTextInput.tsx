import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  Camera,
  Send,
  Stack,
  Typography,
  IconButton as UiIconButton,
  XStack,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useSetAtom} from 'jotai'
import truncate from 'just-truncate'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Alert, Platform, TextInput as RNTextInput} from 'react-native'
import Animated, {
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from 'react-native-reanimated'
import {useTheme} from 'tamagui'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {version} from '../../../utils/environment'
import {
  getImageFromCameraAndTryToResolveThePermissionsAlongTheWay,
  getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay,
  type ImagePickerError,
  type SelectedImage,
} from '../../../utils/imagePickers'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {checkNotificationPermissionsAndAskIfPossibleTEActionAtom} from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {showErrorAlert} from '../../ErrorAlert'
import {chatMolecule} from '../atoms'
import ChatImage from './ChatImage'
import {CHAT_INPUT_NATIVE_ID} from './MessagesList'
import {usePeriodicTypingIndication} from './usePeriodicTypingIndication'

const iosAutocorrectCommitDelayMs = 50

function ChatTextInput(): React.ReactElement | null {
  const theme = useTheme()
  const [value, setValue] = useState('')
  const {sendMessageAtom, replyToMessageAtom} = useMolecule(chatMolecule)
  const [replyToMessage, setReplyToMessage] = useAtom(replyToMessageAtom)
  const sendMessage = useSetAtom(sendMessageAtom)
  const session = useSessionAssumeLoggedIn()
  const {t} = useTranslation()
  const textInputRef = useRef<RNTextInput>(null)
  const latestValueRef = useRef('')
  const pendingIosSendRef = useRef(false)
  const pendingIosSendTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)
  const checkNotificationsAndAskIfPossible = useSetAtom(
    checkNotificationPermissionsAndAskIfPossibleTEActionAtom
  )

  usePeriodicTypingIndication(!!value.trim())

  useEffect(() => {
    if (!replyToMessage) return
    textInputRef.current?.focus()
  }, [replyToMessage])

  const clearTextInput = useCallback(() => {
    textInputRef.current?.clear()
    latestValueRef.current = ''
    setValue('')
  }, [])

  const clearPendingIosSendTimeout = useCallback(() => {
    if (pendingIosSendTimeoutRef.current) {
      clearTimeout(pendingIosSendTimeoutRef.current)
      pendingIosSendTimeoutRef.current = undefined
    }
  }, [])

  const sendChatMessage = useCallback(
    ({text, image}: {text: string; image?: UriString}) => {
      const message: ChatMessage = {
        text,
        image,
        myVersion: version,
        time: unixMillisecondsNow(),
        uuid: generateChatMessageId(),
        repliedTo: replyToMessage
          ? {
              text: truncate(replyToMessage.message.text, 100, '...'),
              messageAuthor:
                replyToMessage.state === 'received' ? 'them' : 'me',
              imageAttachment: replyToMessage.message.imageAttachment,
            }
          : undefined,
        messageType: 'MESSAGE',
        senderPublicKey: session.privateKey.publicKeyPemBase64,
      }
      setReplyToMessage(undefined)

      sendMessage(message)
      void checkNotificationsAndAskIfPossible()()
    },
    [
      replyToMessage,
      session.privateKey.publicKeyPemBase64,
      setReplyToMessage,
      sendMessage,
      checkNotificationsAndAskIfPossible,
    ]
  )

  const sendTextImmediately = useCallback(
    (text: string): boolean => {
      if (!text.trim()) return false

      clearTextInput()
      sendChatMessage({text})
      return true
    },
    [clearTextInput, sendChatMessage]
  )

  const pickAndSendImage = useCallback(
    (pickImage: Effect.Effect<SelectedImage, ImagePickerError>) => {
      void pickImage.pipe(
        Effect.match({
          onSuccess: ({uri}) => {
            sendChatMessage({text: '', image: uri})
          },
          onFailure: (e) => {
            if (e.reason === 'NothingSelected') return
            showErrorAlert({
              title: t('common.somethingWentWrong'),
              description:
                toCommonErrorMessage(e, t) ??
                t('common.somethingWentWrongDescription'),
              error: e,
            })
          },
        }),
        Effect.runPromise
      )
    },
    [sendChatMessage, t]
  )

  const selectImageSource = useCallback(() => {
    Alert.alert(t('loginFlow.photo.selectSource'), undefined, [
      {
        text: t('loginFlow.photo.gallery'),
        onPress: () => {
          pickAndSendImage(
            getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay({})
          )
        },
      },
      {
        text: t('loginFlow.photo.camera'),
        onPress: () => {
          pickAndSendImage(
            getImageFromCameraAndTryToResolveThePermissionsAlongTheWay({})
          )
        },
      },
      {text: t('common.cancel'), style: 'cancel'},
    ])
  }, [pickAndSendImage, t])

  const sendLatestText = useCallback(() => {
    clearPendingIosSendTimeout()
    pendingIosSendRef.current = false
    sendTextImmediately(latestValueRef.current)
  }, [clearPendingIosSendTimeout, sendTextImmediately])

  const scheduleIosSend = useCallback(
    (delayMs: number) => {
      clearPendingIosSendTimeout()
      pendingIosSendTimeoutRef.current = setTimeout(sendLatestText, delayMs)
    },
    [clearPendingIosSendTimeout, sendLatestText]
  )

  const handleChangeText = useCallback(
    (text: string) => {
      latestValueRef.current = text
      setValue(text)

      if (pendingIosSendRef.current) {
        scheduleIosSend(0)
      }
    },
    [scheduleIosSend]
  )

  const sendText = useCallback(() => {
    if (!latestValueRef.current.trim() || pendingIosSendRef.current) return

    if (Platform.OS === 'ios') {
      pendingIosSendRef.current = true
      scheduleIosSend(iosAutocorrectCommitDelayMs)
      return
    }

    sendTextImmediately(latestValueRef.current)
  }, [scheduleIosSend, sendTextImmediately])

  useEffect(() => clearPendingIosSendTimeout, [clearPendingIosSendTimeout])

  const inputStyles = {
    minHeight: 21,
    maxHeight: 110,
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: theme.foregroundPrimary.get(),
    fontFamily: 'TTSatoshi500',
    fontSize: 16,
  }

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
              <ChatImage
                variant="thumbnail"
                image={replyToMessage.message.image}
                imageAttachment={replyToMessage.message.imageAttachment}
              />
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
                nativeID={CHAT_INPUT_NATIVE_ID}
                multiline
                value={value}
                onChangeText={handleChangeText}
                style={inputStyles}
                placeholder={t('messages.typeSomething')}
                placeholderTextColor={theme.foregroundTertiary.get()}
                selectionColor={theme.accentHighlightPrimary.get()}
              />
            </Stack>
            <Animated.View key={value ? 'send' : 'camera'} entering={ZoomIn}>
              {value ? (
                <UiIconButton
                  backgroundColor="$accentYellowSecondary"
                  onPress={sendText}
                >
                  <Send size={20} color={theme.accentHighlightPrimary.get()} />
                </UiIconButton>
              ) : (
                <UiIconButton
                  backgroundColor="transparent"
                  onPress={selectImageSource}
                >
                  <Camera size={24} color={theme.foregroundSecondary.get()} />
                </UiIconButton>
              )}
            </Animated.View>
          </XStack>
        </Stack>
      </XStack>
    </YStack>
  )
}

export default ChatTextInput
