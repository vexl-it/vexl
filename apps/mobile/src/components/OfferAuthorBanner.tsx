import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {
  Circle,
  IconTag,
  PeopleUsers,
  TextTag,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import React from 'react'
import {
  useGetAllClubsForIds,
  useGetAllClubsNamesForIds,
} from '../state/clubs/atom/clubsWithMembersAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
import {getIconTagVariant, getIsOffering} from '../utils/offerHelpers'
import {randomSeedFromOfferInfo} from '../utils/RandomSeed'
import {AnonymousAvatarOrClubImage} from './AnonymousAvatar'
import UserAvatar from './UserAvatar'

function OfferAuthorBanner({
  offer,
  userImage,
  grayAvatar,
}: {
  readonly offer: OneOfferInState
  readonly userImage?: React.ComponentProps<typeof UserAvatar>['userImage']
  readonly grayAvatar?: boolean
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const commonFriendsCount = offer.offerInfo.privatePart.commonFriends.length
  const clubsForOffer = useGetAllClubsForIds(
    offer.offerInfo.privatePart.clubIds
  )
  const clubsNames = useGetAllClubsNamesForIds(
    offer.offerInfo.privatePart.clubIds
  )
  const isMine = !!offer.ownershipInfo
  const isOffering = getIsOffering(
    offer.offerInfo.publicPart.listingType,
    offer.offerInfo.publicPart.offerType
  )
  const friendLevelText = offer.offerInfo.privatePart.friendLevel.includes(
    'FIRST_DEGREE'
  )
    ? t('offer.directFriend')
    : t('offer.friendOfFriend')
  const clubImageUrl = pipe(
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

  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$3">
      <XStack alignItems="center" gap="$3" flex={1} minWidth={0}>
        {userImage ? (
          <UserAvatar
            grayScale={grayAvatar}
            userImage={userImage}
            width={40}
            height={40}
          />
        ) : (
          <AnonymousAvatarOrClubImage
            grayScale={grayAvatar ?? false}
            customSize={40}
            seed={randomSeedFromOfferInfo(offer.offerInfo)}
            clubImageUrl={clubImageUrl}
          />
        )}
        <YStack gap="$2" flex={1} minWidth={0}>
          <Typography
            variant="descriptionBold"
            color="$foregroundPrimary"
            numberOfLines={1}
          >
            {isMine ? t('common.me') : friendLevelText}
          </Typography>
          {clubLabel != null ? (
            <XStack gap="$2" alignItems="center">
              <Typography
                variant="micro"
                color="$foregroundSecondary"
                numberOfLines={1}
              >
                {clubLabel}
              </Typography>
              <Circle
                size="$2"
                backgroundColor={theme.foregroundSecondary.val}
              />
              {!isMine && (
                <XStack gap="$1" alignItems="center">
                  <PeopleUsers
                    size={16}
                    color={theme.foregroundSecondary.val}
                  />
                  <Typography
                    variant="micro"
                    color="$foregroundSecondary"
                    numberOfLines={1}
                  >
                    {t('offer.numberOfCommon', {number: commonFriendsCount})}
                  </Typography>
                </XStack>
              )}
            </XStack>
          ) : !isMine ? (
            <XStack alignItems="center" gap="$1">
              <PeopleUsers size={16} color={theme.foregroundSecondary.val} />
              <Typography
                variant="micro"
                color="$foregroundSecondary"
                numberOfLines={1}
              >
                {t('offer.numberOfCommon', {number: commonFriendsCount})}
              </Typography>
            </XStack>
          ) : null}
        </YStack>
      </XStack>
      <XStack alignItems="center" gap="$1">
        <TextTag
          variant={isOffering ? 'offer' : 'request'}
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
        <IconTag
          variant={getIconTagVariant(offer.offerInfo.publicPart.listingType)}
        />
      </XStack>
    </XStack>
  )
}

export default OfferAuthorBanner
