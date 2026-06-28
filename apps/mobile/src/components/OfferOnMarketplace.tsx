import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {
  IconTag,
  OfferCard,
  TextTag,
  type OfferCardActionButton,
} from '@vexl-next/ui'
import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {chatWithMessagesForOfferAtom} from '../state/chat/hooks/useChatForOffer'
import {shouldUseGrayscaleColours} from '../state/chat/utils/offerStates'
import {
  smallestClubForIdsAtom,
  useGetAllClubsNamesForIds,
} from '../state/clubs/atom/clubsWithMembersAtom'
import {isProductOfferMissingCategory} from '../state/marketplace/utils/isProductOfferMissingCategory'
import {getOtherSideFriendLevel} from '../utils/chat/getOtherSideFriendLevel'
import {isOfferExpired} from '../utils/isOfferExpired'
import {formatInteger} from '../utils/localization/formatting'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
import spokenLanguageToFlagEmoji from '../utils/localization/spokenLanguageToFlagEmoji'
import {getOfferFeeLabel} from '../utils/offerAmountDetails'
import {
  getAmountLabelActionAtom,
  getIconTagVariant,
  getIsOffering,
} from '../utils/offerHelpers'
import {getLocationCompactDisplayLabelForLocations} from '../utils/offerLocationLabels'
import {randomSeedFromOfferInfo} from '../utils/RandomSeed'
import {offerRerequestLimitDaysAtom} from '../utils/versionService/atoms'
import {AnonymousAvatarOrClubImage} from './AnonymousAvatar'

export default function OfferOnMarketplace({
  offer,
  onPress,
  actionButton,
}: {
  offer: OneOfferInState
  onPress?: () => void
  actionButton?: OfferCardActionButton
}): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {publicPart, privatePart} = offer.offerInfo
  const {ownershipInfo} = offer
  const isMine = !!ownershipInfo?.adminId
  const isMyOffer = !!ownershipInfo
  const isExpiredMyOffer = isMine && isOfferExpired(publicPart.expirationDate)
  const isPausedMyOffer = isMine && !publicPart.active
  const rerequestLimitDays = useAtomValue(offerRerequestLimitDaysAtom)
  const getAmountLabel = useSetAtom(getAmountLabelActionAtom)

  const smallestClub = useAtomValue(
    useMemo(
      () => smallestClubForIdsAtom(privatePart.clubIds ?? []),
      [privatePart.clubIds]
    )
  )

  const myClubNames = useGetAllClubsNamesForIds(
    ownershipInfo?.intendedClubs ?? []
  )

  const isOffering = getIsOffering(publicPart.listingType, publicPart.offerType)
  const iconTagVariant = getIconTagVariant(publicPart.listingType)

  const chatForOfferAtom = useMemo(
    () =>
      chatWithMessagesForOfferAtom({
        offerId: offer.offerInfo.offerId,
        isMyOffer,
        otherSidePublicKey: Option.some(publicPart.offerPublicKey),
      }),
    [isMyOffer, offer.offerInfo.offerId, publicPart.offerPublicKey]
  )
  const chatForOffer = useAtomValue(chatForOfferAtom)
  const shouldBeGrayscaled = shouldUseGrayscaleColours({
    chat: chatForOffer,
    isMine,
    offerInfo: offer.offerInfo,
    rerequestLimitDays,
  })

  const name = isMine
    ? t('common.me')
    : (getOtherSideFriendLevel({offerInfo: offer.offerInfo, t}) ??
      t('offer.friendOfFriend'))

  const commonFriendsCount = privatePart.commonFriends.length
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
  const isMissingProductCategory =
    isMine && isProductOfferMissingCategory(offer)
  const statusLabel = isMissingProductCategory
    ? t('marketplace.missingProductCategoriesSuggestion.cardLabel')
    : isExpiredMyOffer && isPausedMyOffer
      ? t('editOffer.expiredAndPausedOffer')
      : isExpiredMyOffer
        ? t('editOffer.expiredOffer')
        : isPausedMyOffer
          ? t('editOffer.pausedOffer')
          : undefined
  const statusVariant =
    isMissingProductCategory || isExpiredMyOffer ? 'warning' : 'waiting'

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
    const result: string[] = []

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
      result.push(
        publicPart.spokenLanguages.map(spokenLanguageToFlagEmoji).join(' ')
      )
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
      statusVariant={statusVariant}
      onPress={onPress}
      actionButton={actionButton}
    />
  )
}
