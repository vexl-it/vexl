import React from 'react'
import {useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import {Circle, XStack, YStack} from '../primitives'
import {IconTag, type IconTagVariant} from './IconTag'
import {TextTag} from './TextTag'
import {Typography} from './Typography'

/** Pixel size the avatar is designed for, e.g. `<Avatar customSize={offerAuthorBannerAvatarSize} />`. */
export const offerAuthorBannerAvatarSize = 40

export interface OfferAuthorBannerProps {
  readonly avatar: React.ReactNode
  readonly name: string
  readonly textTagVariant: 'offer' | 'request'
  readonly textTagLabel: string
  readonly iconTagVariant: IconTagVariant
  readonly clubLabel?: string
  /** E.g. "3 common friends". Omit for the user's own offers. */
  readonly commonFriendsLabel?: string
}

function CommonFriendsLabel({
  label,
}: {
  readonly label: string
}): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack alignItems="center" gap="$1" flexShrink={1} minWidth={0}>
      <PeopleUsers size={16} color={theme.foregroundSecondary.get()} />
      <Typography
        variant="micro"
        color="$foregroundSecondary"
        numberOfLines={1}
        flexShrink={1}
        minWidth={0}
      >
        {label}
      </Typography>
    </XStack>
  )
}

export function OfferAuthorBanner({
  avatar,
  name,
  textTagVariant,
  textTagLabel,
  iconTagVariant,
  clubLabel,
  commonFriendsLabel,
}: OfferAuthorBannerProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack gap="$3" alignItems="flex-start">
      {avatar}
      <YStack flex={1} minWidth={0}>
        <XStack alignItems="center" justifyContent="space-between">
          <Typography
            variant="descriptionBold"
            color="$foregroundPrimary"
            numberOfLines={1}
            flexShrink={1}
            minWidth={0}
          >
            {name}
          </Typography>
          <XStack alignItems="center" gap="$1" flexShrink={0}>
            <TextTag variant={textTagVariant} label={textTagLabel} />
            <IconTag variant={iconTagVariant} />
          </XStack>
        </XStack>
        {clubLabel != null ? (
          <XStack gap="$2" alignItems="center" flexShrink={1} minWidth={0}>
            <Typography
              variant="micro"
              color="$foregroundSecondary"
              numberOfLines={1}
              flexShrink={1}
              minWidth={0}
            >
              {clubLabel}
            </Typography>
            <Circle
              size="$2"
              backgroundColor={theme.foregroundSecondary.get()}
            />
            {commonFriendsLabel != null ? (
              <CommonFriendsLabel label={commonFriendsLabel} />
            ) : null}
          </XStack>
        ) : commonFriendsLabel != null ? (
          <CommonFriendsLabel label={commonFriendsLabel} />
        ) : null}
      </YStack>
    </XStack>
  )
}
