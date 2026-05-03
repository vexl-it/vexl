import {useNavigation} from '@react-navigation/native'
import {
  Button,
  CellPhoneDisabled,
  Stack,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {
  revealContactActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../TradeChecklistFlow/atoms/updatesToBeSentAtom'
import {chatMolecule} from '../atoms'
import {useHideActionForMessage} from '../atoms/createHideActionForMessageMmkvAtom'
import RevealedInfoCard from './RevealedInfoCard'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

function isIdentityRevealApprovalMessage(
  message?: ChatMessageWithState
): boolean {
  if (!message) return false

  return (
    message.message.messageType === 'APPROVE_REVEAL' ||
    ((message.state === 'sent' || message.state === 'received') &&
      message.message.tradeChecklistUpdate?.identity?.status ===
        'APPROVE_REVEAL')
  )
}

function ContactRevealMessageItem({
  message,
}: {
  message: ChatMessageWithState
}): React.ReactElement | null {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {t} = useTranslation()
  const {
    otherSideDataAtom,
    contactRevealStatusAtom,
    contactRevealTriggeredFromTradeChecklistAtom,
    publicKeyPemBase64Atom,
    chatIdAtom,
    revealContactWithUiFeedbackAtom,
    contactRevealRequestMessageIdAtom,
  } = useMolecule(chatMolecule)

  const store = useStore()
  const {image, userName, partialPhoneNumber, fullPhoneNumber} =
    useAtomValue(otherSideDataAtom)
  const revealContact = useSetAtom(revealContactActionAtom)
  const myRealLifeInfo = useAtomValue(userDataRealOrAnonymizedAtom)
  const myPhoneNumber = useAtomValue(userPhoneNumberAtom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)

  const contactRevealRequestMessageId = useAtomValue(
    contactRevealRequestMessageIdAtom
  )

  const onReveal = useCallback(
    (type: 'approve' | 'deny') => {
      revealContact({
        status: type === 'approve' ? 'APPROVE_REVEAL' : 'DISAPPROVE_REVEAL',
        fullPhoneNumber: myRealLifeInfo.fullPhoneNumber,
      })

      Effect.runFork(store.set(submitTradeChecklistUpdatesActionAtom))
    },
    [revealContact, myRealLifeInfo.fullPhoneNumber, store]
  )

  const [contactRevealRequestHidden, hideContactRevealRequest] =
    useHideActionForMessage(contactRevealRequestMessageId)

  const isContactRevealRequest =
    message.message.messageType === 'REQUEST_CONTACT_REVEAL' ||
    ((message.state === 'sent' || message.state === 'received') &&
      message.message.tradeChecklistUpdate?.contact?.status ===
        'REQUEST_REVEAL')

  const otherSidePhoneNumberText = fullPhoneNumber
    ? getInternationalPhoneNumber(fullPhoneNumber)
    : partialPhoneNumber

  if (isContactRevealRequest && contactRevealStatus === 'theyAsked') {
    return (
      <VexlbotActionCard
        description={t('vexlBot.phoneNumber.doYouWantToShare')}
        statusLabel={t('vexlbot.reactionRequired')}
        title={t('vexlBot.phoneNumber.requested', {
          them: t('common.otherSide'),
        })}
      >
        <XStack f={1} gap="$2">
          <Button
            f={1}
            onPress={() => {
              onReveal('deny')
            }}
            size="medium"
            variant="secondary"
          >
            {t('common.noThanks')}
          </Button>
          <Button
            f={1}
            onPress={() => {
              onReveal('approve')
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
    isContactRevealRequest &&
    contactRevealStatus === 'iAsked' &&
    !contactRevealRequestHidden
  ) {
    return (
      <VexlbotActionCard
        title={t('vexlBot.phoneNumber.requestSent', {
          them: t('common.otherSide'),
        })}
        statusLabel={t('common.pending')}
        statusVariant="waitingForConfirmation"
        description={t('vexlBot.phoneNumber.requested', {
          them: t('common.otherSide'),
        })}
      ></VexlbotActionCard>
    )
  }

  if (
    contactRevealStatus === 'shared' &&
    (message.state === 'received' || message.state === 'sent') &&
    (message.message.messageType === 'APPROVE_CONTACT_REVEAL' ||
      message.message.tradeChecklistUpdate?.contact?.status ===
        'APPROVE_REVEAL')
  ) {
    return (
      <RevealedInfoCard
        contactName={userName}
        fullPhoneNumber={fullPhoneNumber}
        leftSide={{
          image: myRealLifeInfo.image,
          name: myRealLifeInfo.userName,
          phoneNumber: getInternationalPhoneNumber(myPhoneNumber),
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
        title={t('messages.phoneNumberRevealed')}
      />
    )
  }

  if (
    contactRevealStatus === 'denied' &&
    (message.message.messageType === 'DISAPPROVE_CONTACT_REVEAL' ||
      ((message.state === 'sent' || message.state === 'received') &&
        message.message.tradeChecklistUpdate?.contact?.status ===
          'DISAPPROVE_REVEAL'))
  ) {
    return (
      <YStack mx="$4" mt="$4">
        <YStack
          alignItems="center"
          backgroundColor="$backgroundSecondary"
          borderRadius="$6"
          gap="$2"
          paddingHorizontal="$5"
          paddingVertical="$4"
          width="100%"
        >
          <Stack mb="$3">
            <CellPhoneDisabled size={32} color="$foregroundPrimary" />
          </Stack>
          <Typography color="$foregroundPrimary" variant="paragraphDemibold">
            {t('common.unknownPhoneNumber')}
          </Typography>
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="paragraphSmall"
          >
            {message.state === 'received'
              ? t('common.theOtherPersonDeclined')
              : t('common.youDeclined')}
          </Typography>
        </YStack>
      </YStack>
    )
  }

  return null
}

export default ContactRevealMessageItem
