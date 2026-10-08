import {useNavigation} from '@react-navigation/native'
import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  Avatar,
  Button,
  RevealDeclinedCard,
  RevealedInfoCard,
  revealedInfoCardAvatarSize,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useStore} from 'jotai'
import React from 'react'
import {SvgXml} from 'react-native-svg'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import anonymizePhoneNumber from '../../../state/chat/utils/anonymizePhoneNumber'
import {
  anonymizedUserDataAtom,
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../state/session/userDataAtoms'
import {
  exchangedDetailsForEvent,
  isAnyDetailSelected,
  isResponse,
  revealEventForMessage,
  selectionsEqual,
  stillPendingDetails,
  type ExchangeDetailsSelection,
  type RevealEvent,
} from '../../../state/tradeChecklist/utils/exchangeDetails'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {declineExchangeDetailsActionAtom} from '../../TradeChecklistFlow/atoms/exchangeDetailsAtoms'
import {formatSelectedDetails} from '../../TradeChecklistFlow/components/ExchangeDetailsFlow/formatSelectedDetails'
import {chatMolecule} from '../atoms'
import {AddToContactsButton} from './AddToContactsButton'
import useOpenExchangeDetails from './useOpenExchangeDetails'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

const requestDeclinedAvatar = require('./images/requestDeclined.png')

function RequestCard({
  event,
  pending,
}: {
  event: RevealEvent
  pending: ExchangeDetailsSelection
}): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const openExchangeDetails = useOpenExchangeDetails()
  const details = formatSelectedDetails(t, pending)

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
      <RevealDeclinedCard
        imageSource={requestDeclinedAvatar}
        title={
          event.direction === 'received'
            ? t('messages.exchangeDetails.theyDeclined')
            : t('messages.exchangeDetails.youDeclined')
        }
        description={t('messages.exchangeDetails.nothingShared')}
      />
    </YStack>
  )
}

function RevealAvatar({
  image,
}: {
  image: RealLifeInfo['image']
}): React.ReactElement {
  return image.type === 'imageUri' ? (
    <Avatar
      customSize={revealedInfoCardAvatarSize}
      source={{uri: resolveLocalUri(image.imageUri)}}
    />
  ) : (
    <Avatar customSize={revealedInfoCardAvatarSize}>
      <SvgXml
        width={revealedInfoCardAvatarSize}
        height={revealedInfoCardAvatarSize}
        xml={image.svgXml.xml}
      />
    </Avatar>
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
  const myAnonymousInfo = useAtomValue(anonymizedUserDataAtom)
  const myPhoneNumber = useAtomValue(userPhoneNumberAtom)

  const {mine, theirs} = exchangedDetailsForEvent(chat, event)
  const theirFullPhoneNumber = theirs.phoneNumber
    ? otherSideData.fullPhoneNumber
    : undefined

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

  const myImage = mine.photo ? myRealLifeInfo.image : myAnonymousInfo.image

  return (
    <YStack mx="$4" mt="$4">
      <RevealedInfoCard
        title={t('messages.exchangeDetails.complete')}
        description={description}
        leftSide={{
          avatar: <RevealAvatar image={myImage} />,
          name: mine.nickname
            ? myRealLifeInfo.userName
            : myAnonymousInfo.userName,
          phoneNumber: mine.phoneNumber
            ? getInternationalPhoneNumber(myPhoneNumber)
            : anonymizePhoneNumber(myPhoneNumber),
        }}
        rightSide={{
          avatar: <RevealAvatar image={otherSideImage} />,
          name: otherSideData.userName,
          phoneNumber: theirFullPhoneNumber
            ? getInternationalPhoneNumber(theirFullPhoneNumber)
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
        action={
          <AddToContactsButton
            fullPhoneNumber={theirFullPhoneNumber}
            userImage={otherSideImage}
            userName={otherSideData.userName}
          />
        }
      />
    </YStack>
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

  const pending = stillPendingDetails(chat, event)

  return (
    <>
      {isResponse(event.reveal) ? <OutcomeCard event={event} /> : null}
      {isAnyDetailSelected(pending) ? (
        <RequestCard event={event} pending={pending} />
      ) : null}
    </>
  )
}

export default ExchangeDetailsMessageItem
