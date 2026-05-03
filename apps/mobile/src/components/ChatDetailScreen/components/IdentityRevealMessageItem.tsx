import {useNavigation} from '@react-navigation/native'
import {Avatar, Button, Typography, XStack, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
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
import {chatMolecule} from '../atoms'
import {useHideActionForMessage} from '../atoms/createHideActionForMessageMmkvAtom'
import RevealedInfoCard from './RevealedInfoCard'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

const requestDeclinedAvatar = require('./images/requestDeclined.png')
const requestPendingAvatar = require('./images/requestPending.png')

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
  } = useMolecule(chatMolecule)
  const {image, userName, partialPhoneNumber, fullPhoneNumber} =
    useAtomValue(otherSideDataAtom)
  const chat = useAtomValue(chatAtom)
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
