import {useNavigation} from '@react-navigation/native'
import {Avatar, Button, Typography, XStack, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Effect, pipe} from 'effect/index'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import anonymizePhoneNumber from '../../../state/chat/utils/anonymizePhoneNumber'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {
  prepareRevealIdentityDraftActionAtom,
  shouldOpenRevealIdentitySummaryAtom,
} from '../../TradeChecklistFlow/atoms/revealIdentityAtoms'
import {
  revealContactActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../TradeChecklistFlow/atoms/updatesToBeSentAtom'
import {chatMolecule} from '../atoms'
import {useHideActionForMessage} from '../atoms/createHideActionForMessageMmkvAtom'
import RevealedInfoCard from './RevealedInfoCard'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

const requestDeclinedAvatar = require('./images/requestDeclined.png')
const requestPendingAvatar = require('./images/requestPending.png')

function isContactRevealRequestMessage(message: ChatMessageWithState): boolean {
  return (
    message.message.messageType === 'REQUEST_CONTACT_REVEAL' ||
    ((message.state === 'sent' || message.state === 'received') &&
      message.message.tradeChecklistUpdate?.contact?.status ===
        'REQUEST_REVEAL')
  )
}

function IdentityRevealMessageItem({
  message,
  isLatest,
}: {
  message: ChatMessageWithState
  isLatest: boolean
}): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {
    chatAtom,
    identityRevealStatusAtom,
    contactRevealStatusAtom,
    otherSideDataAtom,
    disapproveIdentityRevealWithUiFeedbackAtom,
    identityRevealRequestMessageIdAtom,
    messagesAtom,
  } = useMolecule(chatMolecule)
  const {image, userName, partialPhoneNumber, fullPhoneNumber} =
    useAtomValue(otherSideDataAtom)
  const chat = useAtomValue(chatAtom)
  const messages = useAtomValue(messagesAtom)
  const store = useStore()
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)
  const identityRevealRequestMessageId = useAtomValue(
    identityRevealRequestMessageIdAtom
  )
  const myRealLifeInfo = useAtomValue(userDataRealOrAnonymizedAtom)
  const myPhoneNumber = useAtomValue(userPhoneNumberAtom)
  const disapproveIdentityReveal = useSetAtom(
    disapproveIdentityRevealWithUiFeedbackAtom
  )
  const prepareRevealIdentityDraft = useSetAtom(
    prepareRevealIdentityDraftActionAtom
  )
  const shouldOpenRevealIdentitySummary = useAtomValue(
    shouldOpenRevealIdentitySummaryAtom
  )
  const revealContact = useSetAtom(revealContactActionAtom)
  const [identityRevealRequestHidden, hideIdentityRevealRequest] =
    useHideActionForMessage(identityRevealRequestMessageId)

  const myPhoneNumberText =
    contactRevealStatus === 'shared'
      ? getInternationalPhoneNumber(myPhoneNumber)
      : anonymizePhoneNumber(myPhoneNumber)

  const otherSidePhoneNumberText = fullPhoneNumber
    ? getInternationalPhoneNumber(fullPhoneNumber)
    : partialPhoneNumber

  const isIdentityRevealRequest =
    message.message.messageType === 'REQUEST_REVEAL' ||
    ((message.state === 'sent' || message.state === 'received') &&
      message.message.tradeChecklistUpdate?.identity?.status ===
        'REQUEST_REVEAL')

  const requestPhoneNumberReveal = useCallback(() => {
    revealContact({
      status: 'REQUEST_REVEAL',
      fullPhoneNumber: myPhoneNumber,
    })

    Effect.runFork(store.set(submitTradeChecklistUpdatesActionAtom))
  }, [myPhoneNumber, revealContact, store])

  if (isIdentityRevealRequest && identityRevealStatus === 'theyAsked') {
    return (
      <VexlbotActionCard
        mt="$2"
        description={t('messages.otherSideWantsToRevealIdentities')}
        statusLabel={t('vexlbot.reactionRequired')}
        title={t('messages.identityRevealRespondModal.title')}
      >
        <XStack gap="$3" width="100%">
          <Button
            flex={1}
            onPress={() => {
              void disapproveIdentityReveal()
            }}
            size="medium"
            variant="secondary"
          >
            {t('common.noThanks')}
          </Button>
          <Button
            flex={1}
            onPress={() => {
              prepareRevealIdentityDraft()
              navigation.navigate('TradeChecklistFlow', {
                screen: shouldOpenRevealIdentitySummary
                  ? 'RevealIdentitySummary'
                  : 'RevealIdentityPhoto',
                chatId: chat.id,
                inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
              })
            }}
            size="medium"
            variant="primary"
          >
            {t('common.letsdothis')}
          </Button>
        </XStack>
      </VexlbotActionCard>
    )
  }

  if (
    isIdentityRevealRequest &&
    identityRevealStatus === 'iAsked' &&
    !identityRevealRequestHidden
  ) {
    return (
      <RevealedInfoCard
        contactName={userName}
        fullPhoneNumber={fullPhoneNumber}
        leftSide={{
          image: myRealLifeInfo.image,
          name: myRealLifeInfo.userName,
          phoneNumber: myPhoneNumberText,
        }}
        rightSide={{
          image: {source: requestPendingAvatar, type: 'imageAsset'},
          name: '*****',
          phoneNumber: '+*** *** *** ***',
        }}
        title={t('messages.identityRequest.pending')}
      />
    )
  }

  if (
    identityRevealStatus === 'shared' &&
    (message.state === 'received' || message.state === 'sent') &&
    (message.message.messageType === 'APPROVE_REVEAL' ||
      message.message.tradeChecklistUpdate?.identity?.status ===
        'APPROVE_REVEAL')
  ) {
    const hasNewerPendingPhoneNumberMessage = pipe(
      messages,
      Array.some(
        (one) =>
          one.message.time > message.message.time &&
          isContactRevealRequestMessage(one)
      )
    )
    const shouldPromptForPhoneNumber =
      ((contactRevealStatus === 'theyAsked' ||
        contactRevealStatus === 'iAsked') &&
        !hasNewerPendingPhoneNumberMessage) ||
      (contactRevealStatus === 'notStarted' && !fullPhoneNumber)

    return (
      <>
        <RevealedInfoCard
          contactName={userName}
          fullPhoneNumber={fullPhoneNumber}
          leftSide={{
            image: myRealLifeInfo.image,
            name: myRealLifeInfo.userName,
            phoneNumber: myPhoneNumberText,
          }}
          rightSide={{
            image,
            name: userName,
            onAvatarPress:
              image.type === 'imageUri'
                ? () => {
                    navigation.navigate('ChatImagePreview', {
                      imageUri: resolveLocalUri(image.imageUri),
                    })
                  }
                : undefined,
            phoneNumber: otherSidePhoneNumberText,
          }}
          title={t('messages.identityRequestRevealed')}
        />
        {!!shouldPromptForPhoneNumber && (
          <VexlbotActionCard
            mt="$2"
            description={t('vexlBot.phoneNumber.identitiesRevealedDescription')}
            title={t('vexlBot.phoneNumber.identitiesRevealedTitle')}
          >
            <Button
              onPress={requestPhoneNumberReveal}
              size="medium"
              variant="primary"
              width="100%"
            >
              {t('tradeChecklist.options.REVEAL_PHONE_NUMBER')}
            </Button>
          </VexlbotActionCard>
        )}
      </>
    )
  }

  if (
    identityRevealStatus === 'denied' &&
    (message.message.messageType === 'DISAPPROVE_REVEAL' ||
      ((message.state === 'sent' || message.state === 'received') &&
        message.message.tradeChecklistUpdate?.identity?.status ===
          'DISAPPROVE_REVEAL'))
  ) {
    return (
      <YStack mb="$4" mt="$4" mx="$4">
        <YStack
          alignItems="center"
          backgroundColor="$backgroundSecondary"
          borderRadius="$6"
          gap="$1"
          paddingHorizontal="$5"
          paddingVertical="$4"
          width="100%"
        >
          <Avatar customSize={56} source={requestDeclinedAvatar} />
          <Typography color="$foregroundPrimary" variant="paragraphDemibold">
            {t('messages.identityRevealDeclined')}
          </Typography>
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="paragraphSmall"
          >
            {message.state === 'received'
              ? t('messages.themDeclined', {name: t('common.otherSide')})
              : t('messages.youDeclined')}
          </Typography>
        </YStack>
      </YStack>
    )
  }

  return null
}

export default IdentityRevealMessageItem
