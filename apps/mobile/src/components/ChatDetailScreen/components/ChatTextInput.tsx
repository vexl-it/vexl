import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  PlusAdd,
  Send,
  Stack,
  Typography,
  IconButton as UiIconButton,
  XStack,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Schema} from 'effect'
import {useAtom, useSetAtom, useStore} from 'jotai'
import truncate from 'just-truncate'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Platform, TextInput as RNTextInput, type View} from 'react-native'
import Animated, {
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from 'react-native-reanimated'
import {useTheme} from 'tamagui'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {version} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {checkNotificationPermissionsAndAskIfPossibleTEActionAtom} from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import {chatMolecule} from '../atoms'
import {MAX_SELECTED_IMAGES} from './AttachImageMenu'
import ChatImage from './ChatImage'
import {CHAT_INPUT_NATIVE_ID} from './MessagesList'
import SelectedImagesTray from './SelectedImagesTray'
import {usePeriodicTypingIndication} from './usePeriodicTypingIndication'

const iosAutocorrectCommitDelayMs = 50

function ChatTextInput(): React.ReactElement | null {
  const theme = useTheme()
  const [value, setValue] = useState('')
  const {
    sendMessagesAtom,
    replyToMessageAtom,
    selectedImagesAtom,
    attachImageMenuAnchorAtom,
  } = useMolecule(chatMolecule)
  const [replyToMessage, setReplyToMessage] = useAtom(replyToMessageAtom)
  const [selectedImages, setSelectedImages] = useAtom(selectedImagesAtom)
  const setAttachImageMenuAnchor = useSetAtom(attachImageMenuAnchorAtom)
  const sendMessages = useSetAtom(sendMessagesAtom)
  const store = useStore()
  const session = useSessionAssumeLoggedIn()
  const {t} = useTranslation()
  const textInputRef = useRef<RNTextInput>(null)
  const attachButtonRef = useRef<View>(null)
  const latestValueRef = useRef('')
  const pendingIosSendRef = useRef(false)
  const pendingIosSendTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)
  const checkNotificationsAndAskIfPossible = useSetAtom(
    checkNotificationPermissionsAndAskIfPossibleTEActionAtom
  )

  usePeriodicTypingIndication(!!value.trim())
  const hasDraft =
    !!value.trim() || Array.isNonEmptyReadonlyArray(selectedImages)
  const canAttachMoreImages = selectedImages.length < MAX_SELECTED_IMAGES

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

  const sendChatMessages = useCallback(
    (
      contents: Array.NonEmptyReadonlyArray<{text: string; image?: UriString}>
    ) => {
      const time = unixMillisecondsNow()
      const messages = Array.map(
        contents,
        ({text, image}, index): ChatMessage => ({
          text,
          image,
          myVersion: version,
          // Keeps the order of messages sent within the same millisecond.
          time: Schema.decodeSync(UnixMilliseconds)(time + index),
          uuid: generateChatMessageId(),
          repliedTo:
            replyToMessage && index === 0
              ? {
                  text: truncate(replyToMessage.message.text, 100, '...'),
                  messageAuthor:
                    replyToMessage.state === 'received' ? 'them' : 'me',
                  imageAttachment: replyToMessage.message.imageAttachment,
                }
              : undefined,
          messageType: 'MESSAGE',
          senderPublicKey: session.privateKey.publicKeyPemBase64,
        })
      )
      setReplyToMessage(undefined)

      sendMessages(messages)
      void checkNotificationsAndAskIfPossible()()
    },
    [
      replyToMessage,
      session.privateKey.publicKeyPemBase64,
      setReplyToMessage,
      sendMessages,
      checkNotificationsAndAskIfPossible,
    ]
  )

  const hasDraftToSend = useCallback(
    (): boolean =>
      !!latestValueRef.current.trim() ||
      Array.isNonEmptyReadonlyArray(store.get(selectedImagesAtom)),
    [selectedImagesAtom, store]
  )

  const sendDraftImmediately = useCallback(() => {
    const text = latestValueRef.current
    const contents = Array.appendAll(
      Array.map(store.get(selectedImagesAtom), ({uri}) => ({
        text: '',
        image: uri,
      })),
      text.trim() ? [{text}] : []
    )
    if (!Array.isNonEmptyReadonlyArray(contents)) return

    clearTextInput()
    store.set(selectedImagesAtom, [])
    sendChatMessages(contents)
  }, [clearTextInput, selectedImagesAtom, sendChatMessages, store])

  const openAttachImageMenu = useCallback(() => {
    attachButtonRef.current?.measureInWindow((x, y, width, height) => {
      setAttachImageMenuAnchor({x, y, width, height})
    })
  }, [setAttachImageMenuAnchor])

  const sendLatestText = useCallback(() => {
    clearPendingIosSendTimeout()
    pendingIosSendRef.current = false
    sendDraftImmediately()
  }, [clearPendingIosSendTimeout, sendDraftImmediately])

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

  const sendDraft = useCallback(() => {
    if (!hasDraftToSend() || pendingIosSendRef.current) return

    if (Platform.OS === 'ios') {
      pendingIosSendRef.current = true
      scheduleIosSend(iosAutocorrectCommitDelayMs)
      return
    }

    sendDraftImmediately()
  }, [hasDraftToSend, scheduleIosSend, sendDraftImmediately])

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
        <YStack
          flex={1}
          my="$3"
          mx="$4"
          borderRadius="$9"
          backgroundColor="$backgroundOnBar"
        >
          {Array.isNonEmptyReadonlyArray(selectedImages) && (
            <SelectedImagesTray
              images={selectedImages}
              onRemove={(image) => {
                setSelectedImages(Array.filter((one) => one !== image))
              }}
            />
          )}
          <XStack alignItems="center" gap="$2" p="$3">
            <Stack ref={attachButtonRef} collapsable={false}>
              <UiIconButton
                backgroundColor="transparent"
                disabled={!canAttachMoreImages}
                opacity={canAttachMoreImages ? 1 : 0.4}
                onPress={openAttachImageMenu}
              >
                <PlusAdd size={24} color={theme.foregroundSecondary.get()} />
              </UiIconButton>
            </Stack>
            <Stack flex={1} justifyContent="center" pr={hasDraft ? 0 : '$4'}>
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
            {!!hasDraft && (
              <Animated.View entering={ZoomIn}>
                <UiIconButton
                  backgroundColor="$accentYellowSecondary"
                  onPress={sendDraft}
                >
                  <Send size={20} color={theme.accentHighlightPrimary.get()} />
                </UiIconButton>
              </Animated.View>
            )}
          </XStack>
        </YStack>
      </XStack>
    </YStack>
  )
}

export default ChatTextInput
