import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {
  Button,
  ConferenceClub,
  FlagReport,
  InfoCircle,
  MenuItem,
  NavigationBar,
  PeopleUsers,
  Screen,
  Typography,
  useScreenFooterHeight,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {ScrollView} from 'react-native'
import {type RootStackScreenProps} from '../../navigationTypes'
import {chatWithMessagesForOfferAtom} from '../../state/chat/hooks/useChatForOffer'
import {
  canChatBeRequested,
  getRequestState,
} from '../../state/chat/utils/offerStates'
import {useGetAllClubsForIds} from '../../state/clubs/atom/clubsWithMembersAtom'
import {useSingleOffer} from '../../state/marketplace'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {offerRerequestLimitDaysAtom} from '../../utils/versionService/atoms'
import CommonFriends from '../CommonFriends'
import OfferAuthorBanner from '../OfferAuthorBanner'
import OfferPropertiesCard from '../OfferPropertiesCard'
import {
  reportOfferActionAtom,
  showNoCommonFriendsExplanationActionAtom,
} from './atoms'

type Props = RootStackScreenProps<'OfferDetail'>

type FooterState =
  | {readonly type: 'canSend'; readonly noteText: string}
  | {readonly type: 'activeChat'; readonly onOpenChat: () => void}
  | {readonly type: 'waitingToRerequestAgain'; readonly noteText: string}

function Footer({
  state,
  onSendMessage,
}: {
  readonly state: FooterState
  readonly onSendMessage: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  if (state.type === 'activeChat') {
    return (
      <YStack gap="$2">
        <XStack
          backgroundColor="$backgroundSecondary"
          borderRadius="$3"
          padding="$4"
          alignItems="center"
          gap="$2"
        >
          <InfoCircle size={18} color={theme.foregroundSecondary.get()} />
          <Typography
            variant="description"
            color="$foregroundSecondary"
            flex={1}
          >
            {t('offer.interactedRecently')}
          </Typography>
        </XStack>
        <Button variant="secondary" onPress={state.onOpenChat}>
          {t('offer.openChat')}
        </Button>
      </YStack>
    )
  }

  if (state.type === 'waitingToRerequestAgain') {
    return (
      <YStack gap="$2">
        <XStack
          backgroundColor="$pinkBackground"
          borderRadius="$3"
          padding="$4"
          alignItems="center"
          gap="$2"
        >
          <InfoCircle size={18} color={theme.foregroundPrimary.get()} />
          <Typography variant="description" color="$foregroundPrimary" flex={1}>
            {state.noteText}
          </Typography>
        </XStack>
        <Button variant="disabled" onPress={onSendMessage} disabled>
          {t('common.sendAMessage')}
        </Button>
      </YStack>
    )
  }

  return (
    <YStack gap="$2">
      <XStack
        backgroundColor="$backgroundSecondary"
        borderRadius="$3"
        padding="$4"
        alignItems="center"
        gap="$2"
      >
        <InfoCircle size={18} color={theme.foregroundSecondary.get()} />
        <Typography variant="description" color="$foregroundSecondary" flex={1}>
          {state.noteText}
        </Typography>
      </XStack>
      <Button variant="primary" onPress={onSendMessage}>
        {t('common.sendAMessage')}
      </Button>
    </YStack>
  )
}

function OfferDetailScrollContent({
  offer,
  onReportPress,
  onNoCommonFriendsPress,
}: {
  readonly offer: OneOfferInState
  readonly onReportPress: () => void
  readonly onNoCommonFriendsPress: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const {footerHeightAtom} = useScreenFooterHeight()
  const footerHeight = useAtomValue(footerHeightAtom)
  const commonFriendsCount = offer.offerInfo.privatePart.commonFriends.length
  const otherSideClubs = useGetAllClubsForIds(
    offer.offerInfo.privatePart.clubIds
  )
  const clubsCount = otherSideClubs.length
  const hasCommonFriendsOrClubs = commonFriendsCount > 0 || clubsCount > 0
  const isClubOffer =
    offer.offerInfo.privatePart.friendLevel.length === 1 &&
    offer.offerInfo.privatePart.friendLevel[0] === 'CLUB'

  return (
    <ScrollView
      bounces={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{paddingBottom: footerHeight}}
    >
      <YStack gap="$4">
        <OfferAuthorBanner offer={offer} />

        <Typography
          variant="description"
          color="$foregroundPrimary"
          lineHeight={20}
        >
          {offer.offerInfo.publicPart.offerDescription}
        </Typography>

        <OfferPropertiesCard offer={offer} />

        {hasCommonFriendsOrClubs ? (
          <CommonFriends
            commonConnectionsHashes={offer.offerInfo.privatePart.commonFriends}
            verifiedConnectionsHashes={
              offer.offerInfo.privatePart.verifiedCommonFriends
            }
            otherSideClubs={otherSideClubs}
          />
        ) : (
          <XStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$5"
            padding="$5"
            gap="$1"
            alignItems="center"
            onPress={onNoCommonFriendsPress}
          >
            {isClubOffer ? (
              <ConferenceClub
                size={18}
                color={theme.foregroundSecondary.get()}
              />
            ) : (
              <PeopleUsers size={18} color={theme.foregroundSecondary.get()} />
            )}
            <Typography variant="micro" color="$foregroundSecondary" flex={1}>
              {isClubOffer
                ? t('offer.clubOfferExplanation')
                : t('offer.noCommonFriendsExplanation')}
            </Typography>
          </XStack>
        )}

        {!offer.flags.reported ? (
          <MenuItem
            label={t('messages.reportOffer')}
            icon={FlagReport}
            variant="danger"
            showChevron={false}
            onPress={onReportPress}
          />
        ) : null}
      </YStack>
    </ScrollView>
  )
}

function OfferDetailScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const reportOffer = useSetAtom(reportOfferActionAtom)
  const showNoCommonFriendsExplanation = useSetAtom(
    showNoCommonFriendsExplanationActionAtom
  )
  const offer = useSingleOffer(offerId)
  const offerRerequestLimitDays = useAtomValue(offerRerequestLimitDaysAtom)
  const isMyOffer = Option.match(offer, {
    onNone: () => false,
    onSome: (o) => !!o.ownershipInfo,
  })
  const otherSidePublicKey = Option.match(offer, {
    onNone: () => undefined,
    onSome: (o) => o.offerInfo.publicPart.offerPublicKey,
  })

  const chatForOfferAtom = useMemo(
    () =>
      chatWithMessagesForOfferAtom({
        offerId,
        isMyOffer,
        otherSidePublicKey: Option.fromNullable(otherSidePublicKey),
      }),
    [isMyOffer, offerId, otherSidePublicKey]
  )
  const chatForOffer = useAtomValue(chatForOfferAtom)

  const requestState = useMemo(
    () => getRequestState(chatForOffer),
    [chatForOffer]
  )

  const requestPossibleInfo = useMemo(() => {
    if (!chatForOffer) return {canBeRerequested: true} as const
    return canChatBeRequested(chatForOffer, offerRerequestLimitDays)
  }, [chatForOffer, offerRerequestLimitDays])

  const canSendRequest = !chatForOffer || requestPossibleInfo.canBeRerequested

  const handleSendMessage = useCallback(() => {
    navigation.navigate('SendMessage', {offerId})
  }, [navigation, offerId])

  const handleOpenChat = useCallback(() => {
    if (!chatForOffer) return
    navigation.navigate('ChatDetail', {
      otherSideKey: chatForOffer.chat.otherSide.publicKey,
      inboxKey: chatForOffer.chat.inbox.privateKey.publicKeyPemBase64,
    })
  }, [chatForOffer, navigation])

  const footerState: FooterState = useMemo(() => {
    if (canSendRequest) {
      return {
        type: 'canSend',
        noteText: t(`offer.requestStatus.${requestState}`),
      }
    }

    if (
      requestState === 'accepted' ||
      requestState === 'requested' ||
      requestState === 'otherSideLeft'
    ) {
      return {type: 'activeChat', onOpenChat: handleOpenChat}
    }

    const possibleInDays = !requestPossibleInfo.canBeRerequested
      ? requestPossibleInfo.possibleInDays
      : undefined
    const noteText =
      possibleInDays != null && possibleInDays > 1
        ? t('offer.canSendAgainDays', {
            days: formatInteger(possibleInDays, locale),
          })
        : t('offer.canSendAgainTomorrow')

    return {type: 'waitingToRerequestAgain', noteText}
  }, [
    canSendRequest,
    requestState,
    requestPossibleInfo,
    handleOpenChat,
    locale,
    t,
  ])

  const handleNoCommonFriendsPress = useCallback(() => {
    if (Option.isSome(offer)) {
      showNoCommonFriendsExplanation(offer.value)
    }
  }, [offer, showNoCommonFriendsExplanation])

  const handleReportPress = useCallback(() => {
    if (Option.isNone(offer)) return
    void Effect.runPromise(
      Effect.andThen(reportOffer(offer.value), (success) => {
        if (success) safeGoBack()
      })
    )
  }, [reportOffer, offer, safeGoBack])

  const navigationBar = (
    <NavigationBar
      style="back"
      title={t('offerDetail.offerDetail')}
      rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
    />
  )

  if (Option.isNone(offer)) {
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
          <Button variant="primary" onPress={safeGoBack} width="100%">
            {t('common.back')}
          </Button>
        </YStack>
      </Screen>
    )
  }

  return (
    <Screen
      navigationBar={navigationBar}
      footer={<Footer state={footerState} onSendMessage={handleSendMessage} />}
    >
      <OfferDetailScrollContent
        offer={offer.value}
        onReportPress={handleReportPress}
        onNoCommonFriendsPress={handleNoCommonFriendsPress}
      />
    </Screen>
  )
}

export default OfferDetailScreen
