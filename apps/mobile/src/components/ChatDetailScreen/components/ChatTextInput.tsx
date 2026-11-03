import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {ChatComposer} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useSetAtom} from 'jotai'
import truncate from 'just-truncate'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Platform, TextInput as RNTextInput} from 'react-native'
import {useSessionAssumeLoggedIn} from '../../../state/session'
import {version} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {checkNotificationPermissionsAndAskIfPossibleTEActionAtom} from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import UriImageWithSizeLimits from '../../UriImageWithSizeLimits'
import {chatMolecule} from '../atoms'
import {CHAT_INPUT_NATIVE_ID} from './MessagesList'
import {usePeriodicTypingIndication} from './usePeriodicTypingIndication'

const responseImagePreviewLimits = {width: 200, height: 100}
const iosAutocorrectCommitDelayMs = 50

function ChatTextInput(): React.ReactElement | null {
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

  const sendTextImmediately = useCallback(
    (text: string): boolean => {
      if (!text.trim()) return false

      const message: ChatMessage = {
        text,
        myVersion: version,
        time: unixMillisecondsNow(),
        uuid: generateChatMessageId(),
        repliedTo: replyToMessage
          ? {
              text: truncate(replyToMessage.message.text, 100, '...'),
              messageAuthor:
                replyToMessage.state === 'received' ? 'them' : 'me',
              image: replyToMessage.message.image,
            }
          : undefined,
        messageType: 'MESSAGE',
        senderPublicKey: session.privateKey.publicKeyPemBase64,
      }
      clearTextInput()
      setReplyToMessage(undefined)

      sendMessage(message)
      void checkNotificationsAndAskIfPossible()()

      return true
    },
    [
      clearTextInput,
      replyToMessage,
      session.privateKey.publicKeyPemBase64,
      setReplyToMessage,
      sendMessage,
      checkNotificationsAndAskIfPossible,
    ]
  )

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

  return (
    <ChatComposer
      inputRef={textInputRef}
      nativeID={CHAT_INPUT_NATIVE_ID}
      value={value}
      onChangeText={handleChangeText}
      onSend={sendText}
      placeholder={t('messages.typeSomething')}
      reply={
        replyToMessage
          ? {
              label: t('common.replyTo'),
              text: truncate(replyToMessage.message.text, 100, '...'),
              image: replyToMessage.message.image ? (
                <UriImageWithSizeLimits
                  uri={replyToMessage.message.image}
                  limits={responseImagePreviewLimits}
                />
              ) : undefined,
              onDismiss: () => {
                setReplyToMessage(undefined)
              },
            }
          : undefined
      }
    />
  )
}

export default ChatTextInput
