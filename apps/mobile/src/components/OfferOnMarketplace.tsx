import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {
  ChatBubbles,
  IconTag,
  OfferCard,
  TextTag,
  type OfferCardDetail,
} from '@vexl-next/ui'
import {Option} from 'effect'
import {atom, useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useMemo} from 'react'
import {type ChatWithMessages} from '../state/chat/domain'
import {useChatWithMessagesForOfferAtom} from '../state/chat/hooks/useChatForOffer'
import {shouldUseGrayscaleColours} from '../state/chat/utils/offerStates'
import {
  clubNamesForIdsAtom,
  smallestClubForIdsAtom,
} from '../state/clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../state/clubs/domain'
import {useVisibleCommonFriendsForOffer} from '../state/marketplace/hooks/useVisibleCommonFriendsForOffer'
import {isProductOfferMissingCategory} from '../state/marketplace/utils/isProductOfferMissingCategory'
import {getOtherSideFriendLevel} from '../utils/chat/getOtherSideFriendLevel'
import {useNavigateToChatDetail} from '../utils/chat/goToChatDetail'
import {isOfferExpired} from '../utils/isOfferExpired'
import formatSpokenLanguages from '../utils/localization/formatSpokenLanguages'
import {formatInteger} from '../utils/localization/formatting'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
import {getOfferFeeLabel} from '../utils/offerAmountDetails'
import {
  getAmountLabelActionAtom,
  getIconTagVariant,
  getIsOffering,
  getOfferMarkBadge,
} from '../utils/offerHelpers'
import {getLocationCompactDisplayLabelForLocations} from '../utils/offerLocationLabels'
import {randomSeedFromOfferInfo} from '../utils/RandomSeed'
import {offerRerequestLimitDaysAtom} from '../utils/versionService/atoms'
import {AnonymousAvatarOrClubImage} from './AnonymousAvatar'

const noClubNamesAtom = atom<string[]>([])
const noSmallestClubAtom = atom(Option.none<ClubWithMembers>())

export default function OfferOnMarketplace({
  offer,
  onPress,
  chatForOfferAtom,
}: {
  offer: OneOfferInState
  onPress?: () => void
  chatForOfferAtom?: Atom<ChatWithMessages | undefined>
}): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {publicPart, privatePart} = offer.offerInfo
  const {ownershipInfo} = offer
  const isMine = !!ownershipInfo?.adminId
  const isExpiredMyOffer = isMine && isOfferExpired(publicPart.expirationDate)
  const rerequestLimitDays = useAtomValue(offerRerequestLimitDaysAtom)
  const getAmountLabel = useSetAtom(getAmountLabelActionAtom)
  const visibleCommonFriends = useVisibleCommonFriendsForOffer(offer.offerInfo)

  const smallestClub = useAtomValue(
    useMemo(
      () =>
        isMine
          ? noSmallestClubAtom
          : smallestClubForIdsAtom(privatePart.clubIds ?? []),
      [isMine, privatePart.clubIds]
    )
  )

  const myClubNames = useAtomValue(
    useMemo(
      () =>
        isMine
          ? clubNamesForIdsAtom(ownershipInfo?.intendedClubs ?? [])
          : noClubNamesAtom,
      [isMine, ownershipInfo?.intendedClubs]
    )
  )

  const isOffering = getIsOffering(publicPart.listingType, publicPart.offerType)
  const iconTagVariant = getIconTagVariant(publicPart.listingType)

  const fallbackChatForOfferAtom = useChatWithMessagesForOfferAtom(offer)
  const chatForOfferAtomToUse = chatForOfferAtom ?? fallbackChatForOfferAtom
  const chatForOffer = useAtomValue(chatForOfferAtomToUse)
  const shouldBeGrayscaled = shouldUseGrayscaleColours({
    chat: chatForOffer,
    isMine,
    offerInfo: offer.offerInfo,
    rerequestLimitDays,
  })

  const navigateToChat = useNavigateToChatDetail(chatForOffer?.chat)

  const goToChatButton =
    !isMine && !!chatForOffer?.chat && shouldBeGrayscaled
      ? {label: t('offer.goToChat'), onPress: navigateToChat}
      : undefined

  const name = isMine
    ? t('common.me')
    : (getOtherSideFriendLevel({offerInfo: offer.offerInfo, t}) ??
      t('offer.friendOfFriend'))

  const commonFriendsCount = visibleCommonFriends.commonFriends.length
  const commonFriendsText = !isMine
    ? t('marketplace.commonFriendsFormatted', {
        localizedString: formatInteger(commonFriendsCount, locale),
      })
    : undefined

  const clubNames = isMine
    ? myClubNames
    : Option.isSome(smallestClub)
      ? [smallestClub.value.club.name]
      : undefined

  const clubImageUrl = Option.isSome(smallestClub)
    ? smallestClub.value.club.clubImageUrl
    : undefined

  const price = getAmountLabel(offer)
  const markBadge = getOfferMarkBadge(offer.flags.mark?.type)
  const isMissingProductCategory =
    isMine && isProductOfferMissingCategory(offer)
  const statusLabel = isMissingProductCategory
    ? t('marketplace.missingProductCategoriesSuggestion.cardLabel')
    : isExpiredMyOffer
      ? t('editOffer.expiredOffer')
      : undefined

  const premiumLabel = useMemo(
    () =>
      getOfferFeeLabel({
        feeAmount: publicPart.feeAmount,
        listingType: publicPart.listingType,
        locale,
        t,
        spaceAroundSign: true,
      }),
    [locale, publicPart.feeAmount, publicPart.listingType, t]
  )

  const details = useMemo(() => {
    const result: OfferCardDetail[] = []

    if (!publicPart.listingType || publicPart.listingType === 'BITCOIN') {
      if (publicPart.paymentMethod.includes('CASH')) {
        result.push(t('offer.cash'))
      } else if (
        publicPart.paymentMethod.includes('REVOLUT') ||
        publicPart.paymentMethod.includes('BANK')
      ) {
        result.push(t('offer.online'))
      }
    } else {
      if (publicPart.locationState.includes('IN_PERSON')) {
        result.push(t('offerForm.pickup'))
      }
      if (publicPart.locationState.includes('ONLINE')) {
        result.push(t('offer.online'))
      }
    }

    const locationText = getLocationCompactDisplayLabelForLocations(
      publicPart.location
    )
    if (locationText) result.push(locationText)

    if (publicPart.spokenLanguages.length > 0) {
      result.push({
        text: formatSpokenLanguages(publicPart.spokenLanguages),
        icon: ChatBubbles,
      })
    }

    return result
  }, [publicPart, t])

  return (
    <OfferCard
      avatar={
        isMine ? undefined : (
          <AnonymousAvatarOrClubImage
            grayScale={shouldBeGrayscaled}
            customSize="$9"
            seed={randomSeedFromOfferInfo(offer.offerInfo)}
            clubImageUrl={clubImageUrl}
          />
        )
      }
      markBadge={markBadge}
      name={name}
      textTag={
        <TextTag
          variant={
            shouldBeGrayscaled ? 'neutral' : isOffering ? 'offer' : 'request'
          }
          label={
            isMine
              ? isOffering
                ? t('marketplace.iHave')
                : t('marketplace.iWant')
              : isOffering
                ? t('marketplace.has')
                : t('marketplace.wants')
          }
        />
      }
      iconTag={
        <IconTag neutral={shouldBeGrayscaled} variant={iconTagVariant} />
      }
      commonFriends={commonFriendsText}
      clubNames={clubNames}
      price={price}
      premiumLabel={premiumLabel.length > 0 ? premiumLabel : undefined}
      description={publicPart.offerDescription}
      details={details}
      statusLabel={statusLabel}
      onPress={onPress}
      actionButton={goToChatButton}
    />
  )
}
