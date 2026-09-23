import {useNavigation} from '@react-navigation/native'
import {Avatar, Button, Typography, XStack, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useStore} from 'jotai'
import React from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import anonymizePhoneNumber from '../../../state/chat/utils/anonymizePhoneNumber'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../state/session/userDataAtoms'
import {
  exchangedDetails,
  isAnyDetailSelected,
  isCurrentPendingRequest,
  isResponse,
  latestReveal,
  requestedDetails,
  revealEventForMessage,
  selectionsEqual,
  type RevealEvent,
} from '../../../state/tradeChecklist/utils/exchangeDetails'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {declineExchangeDetailsActionAtom} from '../../TradeChecklistFlow/atoms/exchangeDetailsAtoms'
import {formatSelectedDetails} from '../../TradeChecklistFlow/components/ExchangeDetailsFlow/formatSelectedDetails'
import {chatMolecule} from '../atoms'
import RevealedInfoCard from './RevealedInfoCard'
import useOpenExchangeDetails from './useOpenExchangeDetails'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

const requestDeclinedAvatar = require('./images/requestDeclined.png')

function RequestCard({event}: {event: RevealEvent}): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const openExchangeDetails = useOpenExchangeDetails()
  const details = formatSelectedDetails(t, requestedDetails(event.reveal))

  if (event.direction === 'sent') {
    return (
      <VexlbotActionCard
        mt="$2"
        statusLabel={t('common.pending')}
        title={t('messages.exchangeDetails.youAsked')}
        description={details}
        details={[t('messages.exchangeDetails.yourDetailsHidden')]}
      />
    )
  }

  return (
    <VexlbotActionCard
      mt="$2"
      statusLabel={t('vexlbot.reactionRequired')}
      title={t('messages.exchangeDetails.theyWant')}
      description={details}
      details={[t('messages.exchangeDetails.reviewBeforeAgreeing')]}
    >
      <XStack gap="$3" width="100%">
        <Button
          flex={1}
          size="medium"
          variant="secondary"
          onPress={() => {
            Effect.runFork(store.set(declineExchangeDetailsActionAtom))
          }}
        >
          {t('common.noThanks')}
        </Button>
        <Button
          flex={1}
          size="medium"
          variant="primary"
          onPress={openExchangeDetails}
        >
          {t('messages.exchangeDetails.review')}
        </Button>
      </XStack>
    </VexlbotActionCard>
  )
}

function DeclinedCard({event}: {event: RevealEvent}): React.ReactElement {
  const {t} = useTranslation()

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
          {event.direction === 'received'
            ? t('messages.exchangeDetails.theyDeclined')
            : t('messages.exchangeDetails.youDeclined')}
        </Typography>
        <Typography
          color="$foregroundSecondary"
          textAlign="center"
          variant="paragraphSmall"
        >
          {t('messages.exchangeDetails.nothingShared')}
        </Typography>
      </YStack>
    </YStack>
  )
}

function OutcomeCard({event}: {event: RevealEvent}): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {chatWithMessagesAtom, otherSideDataAtom} = useMolecule(chatMolecule)
  const chat = useAtomValue(chatWithMessagesAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideImage = otherSideData.image
  const myRealLifeInfo = useAtomValue(userDataRealOrAnonymizedAtom)
  const myPhoneNumber = useAtomValue(userPhoneNumberAtom)

  const {mine, theirs} = exchangedDetails({
    sent: latestReveal({chat, direction: 'sent', until: event.timestamp}),
    received: latestReveal({
      chat,
      direction: 'received',
      until: event.timestamp,
    }),
  })

  if (!isAnyDetailSelected(mine) && !isAnyDetailSelected(theirs)) {
    return <DeclinedCard event={event} />
  }

  const description = selectionsEqual(mine, theirs)
    ? t('messages.exchangeDetails.youBothShared', {
        details: formatSelectedDetails(t, mine),
      })
    : [
        t('messages.exchangeDetails.theyShared', {
          details: formatSelectedDetails(t, theirs),
        }),
        t('messages.exchangeDetails.youShared', {
          details: formatSelectedDetails(t, mine),
        }),
      ].join('\n')

  return (
    <RevealedInfoCard
      title={t('messages.exchangeDetails.complete')}
      description={description}
      contactName={otherSideData.userName}
      fullPhoneNumber={otherSideData.fullPhoneNumber}
      leftSide={{
        image: myRealLifeInfo.image,
        name: myRealLifeInfo.userName,
        phoneNumber: mine.phoneNumber
          ? getInternationalPhoneNumber(myPhoneNumber)
          : anonymizePhoneNumber(myPhoneNumber),
      }}
      rightSide={{
        image: otherSideData.image,
        name: otherSideData.userName,
        phoneNumber: otherSideData.fullPhoneNumber
          ? getInternationalPhoneNumber(otherSideData.fullPhoneNumber)
          : otherSideData.partialPhoneNumber,
        onAvatarPress:
          otherSideImage.type === 'imageUri'
            ? () => {
                navigation.navigate('ChatImagePreview', {
                  imageUri: resolveLocalUri(otherSideImage.imageUri),
                })
              }
            : undefined,
      }}
    />
  )
}

function ExchangeDetailsMessageItem({
  message,
}: {
  message: ChatMessageWithState
}): React.ReactElement | null {
  const {chatWithMessagesAtom} = useMolecule(chatMolecule)
  const chat = useAtomValue(chatWithMessagesAtom)
  const event = revealEventForMessage(chat, message)

  if (!event) return null

  const showRequest =
    isAnyDetailSelected(requestedDetails(event.reveal)) &&
    isCurrentPendingRequest(chat, event)

  return (
    <>
      {isResponse(event.reveal) ? <OutcomeCard event={event} /> : null}
      {showRequest ? <RequestCard event={event} /> : null}
    </>
  )
}

export default ExchangeDetailsMessageItem
