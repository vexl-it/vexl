import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {
  CommonFriendsSummary,
  IconTag,
  TextTag,
  Typography,
  XStack,
  YStack,
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
import {useTrustedFriendsText} from '../utils/localization/useTrustedFriendsText'
import {
  getIconTagVariant,
  getIsOffering,
  getOfferIntentLabel,
} from '../utils/offerHelpers'
import {randomSeedFromOfferInfo} from '../utils/RandomSeed'
import {AnonymousAvatarOrClubImage} from './AnonymousAvatar'
import {ProfileImageAvatar} from './ProfileImageAvatar'

function OfferAuthorBanner({
  offer,
  realUserName,
  userImage,
  grayAvatar,
  clubIdsForAvatar,
}: {
  readonly offer: OneOfferInState
  readonly realUserName?: UserName
  readonly userImage?: React.ComponentProps<typeof ProfileImageAvatar>['image']
  readonly grayAvatar?: boolean
  readonly clubIdsForAvatar?: readonly ClubUuid[]
}): React.ReactElement {
  const {t} = useTranslation()
  const visibleCommonFriends = useVisibleCommonFriendsForOffer(offer.offerInfo)
  const commonFriendsCount = visibleCommonFriends.commonFriends.length
  const locale = useAtomValue(formattingLocaleAtom)
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
  const trustedFriendsText = useTrustedFriendsText(
    isMine ? 0 : visibleCommonFriends.verifiedCommonFriends.length
  )
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

  const showProfileImage =
    !!userImage && (!clubImageUrl || userImage.type === 'imageUri')

  return (
    <XStack gap="$3" alignItems="flex-start">
      {showProfileImage ? (
        <ProfileImageAvatar
          grayscale={grayAvatar}
          image={userImage}
          size="$9"
        />
      ) : (
        <AnonymousAvatarOrClubImage
          grayScale={grayAvatar ?? false}
          size="$9"
          seed={randomSeedFromOfferInfo(offer.offerInfo)}
          clubImageUrl={clubImageUrl}
        />
      )}
      <YStack flex={1} minWidth={0}>
        <XStack alignItems="center" justifyContent="space-between">
          <Typography
            variant="descriptionBold"
            color="$foregroundPrimary"
            numberOfLines={1}
            flexShrink={1}
            minWidth={0}
          >
            {isMine ? t('common.me') : friendLevelText}
          </Typography>
          <XStack alignItems="center" gap="$1" flexShrink={0}>
            <TextTag
              variant={isOffering ? 'offer' : 'request'}
              label={getOfferIntentLabel({isMine, isOffering, t})}
            />
            <IconTag
              variant={getIconTagVariant(
                offer.offerInfo.publicPart.listingType
              )}
            />
          </XStack>
        </XStack>
        <CommonFriendsSummary
          clubNames={clubLabel ? [clubLabel] : undefined}
          commonFriends={
            isMine
              ? undefined
              : t('offer.numberOfCommon', {
                  number: formatInteger(commonFriendsCount, locale),
                })
          }
          trustedFriends={trustedFriendsText}
        />
      </YStack>
    </XStack>
  )
}

export default OfferAuthorBanner
