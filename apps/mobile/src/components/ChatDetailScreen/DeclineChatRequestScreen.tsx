import {
  Button,
  DismissKeyboardOnPressOutside,
  ChevronLeft,
  EmptyState,
  LabeledTextArea,
  NavigationBar,
  Screen,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useWindowDimensions} from 'react-native'
import {type RootStackScreenProps} from '../../navigationTypes'
import {focusChatWithMessagesByKeysAtom} from '../../state/chat/atoms/focusChatWithMessagesAtom'
import {dummyChatWithMessages} from '../../state/chat/domain'
import hasNonNullableValueAtom from '../../utils/atomUtils/hasNonNullableValueAtom'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import OfferAuthorBanner from '../OfferAuthorBanner'
import {ChatScope, chatMolecule} from './atoms'

type Props = RootStackScreenProps<'DeclineChatRequest'>
const MAX_DECLINE_REASON_LENGTH = 500

function DeclineChatRequestContent({
  chatExists,
}: {
  readonly chatExists: boolean
}): React.ReactElement {
  const {t} = useTranslation()
  const {height: windowHeight} = useWindowDimensions()
  const safeGoBack = useSafeGoBack()
  const {offerForChatAtom, approveChatRequestActionAtom} =
    useMolecule(chatMolecule)
  const approveChat = useSetAtom(approveChatRequestActionAtom)
  const offer = useAtomValue(offerForChatAtom)
  const isActiveRef = useRef(true)
  const isSubmittingRef = useRef(false)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasText = text.trim().length > 0
  const isSendDisabled = !hasText || isSubmitting

  useEffect(
    () => () => {
      isActiveRef.current = false
    },
    []
  )

  const handleBack = useCallback(() => {
    isActiveRef.current = false
    safeGoBack()
  }, [safeGoBack])

  const stopSubmitting = useCallback(() => {
    isSubmittingRef.current = false
    if (isActiveRef.current) {
      setIsSubmitting(false)
    }
  }, [])

  const submitDecline = useCallback(
    (message: string) => {
      if (isSubmittingRef.current) return

      isSubmittingRef.current = true
      setIsSubmitting(true)

      void Effect.runPromise(approveChat({approve: false, message}))
        .then((success) => {
          if (success) {
            if (isActiveRef.current) handleBack()
            return
          }

          stopSubmitting()
        })
        .catch(() => {
          stopSubmitting()
        })
    },
    [approveChat, handleBack, stopSubmitting]
  )

  const handleSkip = useCallback(() => {
    submitDecline('')
  }, [submitDecline])

  const handleSend = useCallback(() => {
    if (isSendDisabled) return

    submitDecline(text)
  }, [isSendDisabled, submitDecline, text])

  const navigationBar = (
    <NavigationBar
      style="back"
      title={t('common.sendAMessage')}
      leftAction={{icon: ChevronLeft, onPress: handleBack}}
    />
  )

  if (!chatExists) {
    return (
      <Screen navigationBar={navigationBar}>
        <EmptyState
          fullscreen
          title={t('common.chatNotFoundError')}
          action={{
            label: t('common.back'),
            onPress: handleBack,
            variant: 'primary',
          }}
        />
      </Screen>
    )
  }

  if (!offer) {
    return (
      <Screen navigationBar={navigationBar}>
        <EmptyState
          fullscreen
          title={t('offer.offerNotFound')}
          action={{
            label: t('common.back'),
            onPress: handleBack,
            variant: 'primary',
          }}
        />
      </Screen>
    )
  }

  return (
    <Screen
      navigationBar={navigationBar}
      footer={
        <XStack gap="$4">
          <Button
            variant="secondary"
            flex={1}
            onPress={handleSkip}
            disabled={isSubmitting}
          >
            {t('common.skip')}
          </Button>
          <Button
            variant={isSendDisabled ? 'disabled' : 'primary'}
            disabled={isSendDisabled}
            flex={1}
            onPress={handleSend}
          >
            {t('common.send')}
          </Button>
        </XStack>
      }
    >
      <DismissKeyboardOnPressOutside>
        <YStack flex={1} gap="$5">
          <OfferAuthorBanner offer={offer} />
          <LabeledTextArea
            label={t('messages.stateYourReasonForRejection')}
            placeholder={t('messages.stateYourReasonForRejection')}
            minHeight={windowHeight * 0.3}
            maxLength={MAX_DECLINE_REASON_LENGTH}
            value={text}
            onChangeText={setText}
          />
        </YStack>
      </DismissKeyboardOnPressOutside>
    </Screen>
  )
}

export default function DeclineChatRequestScreen({
  route: {
    params: {otherSideKey, inboxKey},
  },
}: Props): React.ReactElement {
  const {nonNullChatWithMessagesAtom, chatExistsAtom} = useMemo(() => {
    const chatWithMessagesAtom = focusChatWithMessagesByKeysAtom({
      otherSideKey,
      inboxKey,
    })

    const nonNullChatWithMessagesAtom = valueOrDefaultAtom({
      nullableAtom: chatWithMessagesAtom,
      dummyValue: dummyChatWithMessages,
    })

    const chatExistsAtom = hasNonNullableValueAtom(chatWithMessagesAtom)

    return {nonNullChatWithMessagesAtom, chatExistsAtom}
  }, [inboxKey, otherSideKey])

  const chatExists = useAtomValue(chatExistsAtom)

  return (
    <ScopeProvider scope={ChatScope} value={nonNullChatWithMessagesAtom}>
      <DeclineChatRequestContent chatExists={chatExists} />
    </ScopeProvider>
  )
}
