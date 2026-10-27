import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {
  OfferAuthorBanner as OfferAuthorBannerView,
  offerAuthorBannerAvatarSize,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {
  smallestClubForIdsAtom,
  useGetAllClubsForIds,
  useGetAllClubsNamesForIds,
} from '../state/clubs/atom/clubsWithMembersAtom'
import {useVisibleCommonFriendsForOffer} from '../state/marketplace/hooks/useVisibleCommonFriendsForOffer'
import {getOtherSideFriendLevel} from '../utils/chat/getOtherSideFriendLevel'
import {formatInteger} from '../utils/localization/formatting'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
import {getIconTagVariant, getIsOffering} from '../utils/offerHelpers'
import {randomSeedFromOfferInfo} from '../utils/RandomSeed'
import {AnonymousAvatarOrClubImage} from './AnonymousAvatar'
import UserAvatar from './UserAvatar'

function OfferAuthorBanner({
  offer,
  realUserName,
  userImage,
  grayAvatar,
  clubIdsForAvatar,
}: {
  readonly offer: OneOfferInState
  readonly realUserName?: UserName
  readonly userImage?: React.ComponentProps<typeof UserAvatar>['userImage']
  readonly grayAvatar?: boolean
  readonly clubIdsForAvatar?: readonly ClubUuid[]
}): React.ReactElement {
  const {t} = useTranslation()
  const visibleCommonFriends = useVisibleCommonFriendsForOffer(offer.offerInfo)
  const commonFriendsCount = visibleCommonFriends.commonFriends.length
  const locale = useAtomValue(formattingLocaleAtom)
  const localizedCommonFriendsCount = formatInteger(commonFriendsCount, locale)
  const clubsForOffer = useGetAllClubsForIds(
    offer.offerInfo.privatePart.clubIds
  )
  const clubsNames = useGetAllClubsNamesForIds(
    offer.offerInfo.privatePart.clubIds
  )
  const avatarClub = useAtomValue(
    React.useMemo(
      () =>
        smallestClubForIdsAtom(
          clubIdsForAvatar ?? offer.offerInfo.privatePart.clubIds
        ),
      [clubIdsForAvatar, offer.offerInfo.privatePart.clubIds]
    )
  )
  const isMine = !!offer.ownershipInfo
  const isOffering = getIsOffering(
    offer.offerInfo.publicPart.listingType,
    offer.offerInfo.publicPart.offerType
  )
  const friendLevelText =
    realUserName ??
    getOtherSideFriendLevel({offerInfo: offer.offerInfo, t}) ??
    t('offer.friendOfFriend')
  const clubImageUrl = Option.isSome(avatarClub)
    ? avatarClub.value.club.clubImageUrl
    : pipe(
        clubsForOffer,
        Array.head,
        Option.map((club) => club.clubImageUrl),
        Option.getOrUndefined
      )
  const clubLabel =
    clubsNames.length === 1
      ? clubsNames[0]
      : clubsNames.length > 1
        ? t('clubs.multipleClubs')
        : undefined

  const shouldDisplayClubImage = clubImageUrl && userImage?.type !== 'imageUri'

  const avatar = shouldDisplayClubImage ? (
    <AnonymousAvatarOrClubImage
      grayScale={grayAvatar ?? false}
      customSize={offerAuthorBannerAvatarSize}
      seed={randomSeedFromOfferInfo(offer.offerInfo)}
      clubImageUrl={clubImageUrl}
    />
  ) : userImage ? (
    <UserAvatar
      grayScale={grayAvatar}
      userImage={userImage}
      width={offerAuthorBannerAvatarSize}
      height={offerAuthorBannerAvatarSize}
    />
  ) : (
    <AnonymousAvatarOrClubImage
      grayScale={grayAvatar ?? false}
      customSize={offerAuthorBannerAvatarSize}
      seed={randomSeedFromOfferInfo(offer.offerInfo)}
      clubImageUrl={clubImageUrl}
    />
  )

  return (
    <OfferAuthorBannerView
      avatar={avatar}
      name={isMine ? t('common.me') : friendLevelText}
      textTagVariant={isOffering ? 'offer' : 'request'}
      textTagLabel={
        isMine
          ? isOffering
            ? t('marketplace.iHave')
            : t('marketplace.iWant')
          : isOffering
            ? t('marketplace.has')
            : t('marketplace.wants')
      }
      iconTagVariant={getIconTagVariant(offer.offerInfo.publicPart.listingType)}
      clubLabel={clubLabel}
      commonFriendsLabel={
        isMine
          ? undefined
          : t('offer.numberOfCommon', {number: localizedCommonFriendsCount})
      }
    />
  )
}

export default OfferAuthorBanner
