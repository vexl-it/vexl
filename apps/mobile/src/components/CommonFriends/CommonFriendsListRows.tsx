import {EditRow, Image, TrustBadge, UserImagePlaceholder} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import React, {memo} from 'react'
import {Stack, useTheme} from 'tamagui'
import {type CommonFriendsClub} from '../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import ContactPictureImage from '../ContactPictureImage'

function FriendListItem({
  friend,
  trusted,
}: {
  readonly friend: StoredContactWithComputedValues
  readonly trusted?: boolean
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const internationalNumber = parsePhoneNumber(
    friend.computedValues.normalizedNumber
  ).number?.international

  return (
    <EditRow
      state="profile"
      headline={friend.info.name}
      overline={internationalNumber ?? friend.computedValues.normalizedNumber}
      showEditButton={false}
      avatar={{
        children: (
          <ContactPictureImage
            width={40}
            height={40}
            objectFit="cover"
            contactId={friend.info.nonUniqueContactId}
            fallback={<UserImagePlaceholder size={40} />}
          />
        ),
      }}
      avatarBadge={
        trusted ? (
          <TrustBadge
            variant="overlay"
            ringColor={theme.backgroundSecondary.get()}
            accessibilityLabel={t('commonFriends.trustedFriend')}
          />
        ) : undefined
      }
    />
  )
}

export const MemoizedFriendListItem = memo(FriendListItem)

function ClubListItem({
  club,
}: {
  readonly club: CommonFriendsClub
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <EditRow
      state="profile"
      headline={club.name}
      overline={t('commonFriends.club')}
      showEditButton={false}
      avatar={{
        children: (
          <Stack
            width={40}
            height={40}
            borderRadius="$3"
            overflow="hidden"
            backgroundColor="$accentYellowSecondary"
          >
            <Image
              source={{uri: club.clubImageUrl}}
              width="100%"
              height="100%"
              objectFit="cover"
            />
          </Stack>
        ),
      }}
    />
  )
}

export const MemoizedClubListItem = memo(ClubListItem)
