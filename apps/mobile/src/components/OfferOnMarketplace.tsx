import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {IconTag, OfferCard, TextTag} from '@vexl-next/ui'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {chatWithMessagesForOfferAtom} from '../state/chat/hooks/useChatForOffer'
import {shouldUseGrayscaleColours} from '../state/chat/utils/offerStates'
import {
  smallestClubForIdsAtom,
  useGetAllClubsNamesForIds,
} from '../state/clubs/atom/clubsWithMembersAtom'
import {getOtherSideFriendLevel} from '../utils/chat/getOtherSideFriendLevel'
import {formatFullCurrencyAmount} from '../utils/localization/currency'
import {
  getCurrentLocale,
  useTranslation,
} from '../utils/localization/I18nProvider'
import spokenLanguageToFlagEmoji from '../utils/localization/spokenLanguageToFlagEmoji'
import {getOfferFeeLabel} from '../utils/offerAmountDetails'
import {getIconTagVariant, getIsOffering} from '../utils/offerHelpers'
import {randomSeedFromOfferInfo} from '../utils/RandomSeed'
import {offerRerequestLimitDaysAtom} from '../utils/versionService/atoms'
import {AnonymousAvatarOrClubImage} from './AnonymousAvatar'

export default function OfferOnMarketplace({
  offer,
  onPress,
}: {
  offer: OneOfferInState
  onPress?: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const locale = getCurrentLocale()
  const {publicPart, privatePart} = offer.offerInfo
  const {ownershipInfo} = offer
  const isMine = !!ownershipInfo?.adminId
  const isMyOffer = !!ownershipInfo
  const rerequestLimitDays = useAtomValue(offerRerequestLimitDaysAtom)

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
    ? t('marketplace.commonFriends', {count: commonFriendsCount})
    : undefined

  const clubNames = isMine
    ? myClubNames
    : Option.isSome(smallestClub)
      ? [smallestClub.value.club.name]
      : undefined

  const clubImageUrl = Option.isSome(smallestClub)
    ? smallestClub.value.club.clubImageUrl
    : undefined

  const price = useMemo(() => {
    if (!publicPart.listingType || publicPart.listingType === 'BITCOIN') {
      const top = formatFullCurrencyAmount(
        publicPart.currency,
        publicPart.amountTopLimit
      )
      if (publicPart.amountBottomLimit > 0) {
        const bottom = formatFullCurrencyAmount(
          publicPart.currency,
          publicPart.amountBottomLimit
        )
        return `${bottom} \u2013 ${top}`
      }
      return `${t('offer.upTo')} ${top}`
    }
    if (publicPart.amountBottomLimit !== 0) {
      return formatFullCurrencyAmount(
        publicPart.currency,
        publicPart.amountBottomLimit
      )
    }
    return ''
  }, [
    publicPart.currency,
    publicPart.amountBottomLimit,
    publicPart.amountTopLimit,
    publicPart.listingType,
    t,
  ])

  const premiumLabel = useMemo(
    () =>
      getOfferFeeLabel({
        feeAmount: publicPart.feeAmount,
        locale,
        t,
        spaceAroundSign: true,
      }),
    [locale, publicPart.feeAmount, t]
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

    if (publicPart.location.length > 0) {
      const loc = publicPart.location[0]
      if (loc) {
        const extra = publicPart.location.length - 1
        const locationText =
          extra > 0
            ? `${loc.shortAddress || loc.address} +${String(extra)}`
            : loc.shortAddress || loc.address
        result.push(locationText)
      }
    }

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
      onPress={onPress}
    />
  )
}
