import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
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
import {useAtomValue} from 'jotai'
import React from 'react'
import {
  smallestClubForIdsAtom,
  useGetAllClubsForIds,
  useGetAllClubsNamesForIds,
} from '../state/clubs/atom/clubsWithMembersAtom'
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
  const theme = useTheme()
  const commonFriendsCount = offer.offerInfo.privatePart.commonFriends.length
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

  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$3">
      <XStack alignItems="center" gap="$3" flex={1} minWidth={0}>
        {shouldDisplayClubImage ? (
          <AnonymousAvatarOrClubImage
            grayScale={grayAvatar ?? false}
            customSize={40}
            seed={randomSeedFromOfferInfo(offer.offerInfo)}
            clubImageUrl={clubImageUrl}
          />
        ) : userImage ? (
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
                backgroundColor={theme.foregroundSecondary.get()}
              />
              {!isMine && (
                <XStack gap="$1" alignItems="center">
                  <PeopleUsers
                    size={16}
                    color={theme.foregroundSecondary.get()}
                  />
                  <Typography
                    variant="micro"
                    color="$foregroundSecondary"
                    numberOfLines={1}
                  >
                    {t('offer.numberOfCommon', {
                      number: localizedCommonFriendsCount,
                    })}
                  </Typography>
                </XStack>
              )}
            </XStack>
          ) : !isMine ? (
            <XStack alignItems="center" gap="$1">
              <PeopleUsers size={16} color={theme.foregroundSecondary.get()} />
              <Typography
                variant="micro"
                color="$foregroundSecondary"
                numberOfLines={1}
              >
                {t('offer.numberOfCommon', {
                  number: localizedCommonFriendsCount,
                })}
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
