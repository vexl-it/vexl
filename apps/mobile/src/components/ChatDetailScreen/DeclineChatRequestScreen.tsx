import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  Stack,
  TextArea,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Dimensions, Keyboard, Pressable} from 'react-native'
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
  const hasReachedCharacterLimit = text.length >= MAX_DECLINE_REASON_LENGTH
  const isSendDisabled = !hasText || hasReachedCharacterLimit || isSubmitting

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
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$5">
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {t('common.chatNotFoundError')}
          </Typography>
          <Button variant="primary" onPress={handleBack} width="100%">
            {t('common.back')}
          </Button>
        </YStack>
      </Screen>
    )
  }

  if (!offer) {
    return (
      <Screen navigationBar={navigationBar}>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$5">
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {t('offer.offerNotFound')}
          </Typography>
          <Button variant="primary" onPress={handleBack} width="100%">
            {t('common.back')}
          </Button>
        </YStack>
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
      <Pressable style={{flex: 1}} onPress={Keyboard.dismiss}>
        <YStack gap="$5">
          <OfferAuthorBanner offer={offer} />
          <YStack gap="$2">
            <Stack
              backgroundColor="$backgroundTertiary"
              px="$4"
              py="$5"
              borderRadius="$4"
              borderBottomRightRadius="$2"
              borderBottomLeftRadius="$2"
            >
              <Typography variant="descriptionBold" color="$foregroundPrimary">
                {t('messages.stateYourReasonForRejection')}
              </Typography>
            </Stack>
            <TextArea
              height={Dimensions.get('window').height * 0.3}
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              py="$6"
              px="$4"
              borderTopRightRadius="$2"
              borderTopLeftRadius="$2"
              placeholder={t('messages.stateYourReasonForRejection')}
              placeholderTextColor="$foregroundSecondary"
              value={text}
              onChangeText={setText}
              fontFamily="$body"
              fontSize="$5"
              lineHeight={24}
              fontWeight="500"
              color="$foregroundPrimary"
              verticalAlign="top"
              borderWidth={0}
            />
            <Typography
              variant="micro"
              color={
                hasReachedCharacterLimit
                  ? '$redForeground'
                  : '$foregroundSecondary'
              }
              textAlign="right"
            >
              {`${text.length}/${MAX_DECLINE_REASON_LENGTH}`}
            </Typography>
          </YStack>
        </YStack>
      </Pressable>
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
