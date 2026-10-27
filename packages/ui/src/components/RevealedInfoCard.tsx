import React from 'react'
import {TouchableOpacity} from 'react-native'
import {useTheme} from 'tamagui'

import {ArrowsHorizontal} from '../icons/ArrowsHorizontal'
import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

/** Pixel size the side avatars are designed for, e.g. `<Avatar customSize={revealedInfoCardAvatarSize} />`. */
export const revealedInfoCardAvatarSize = 80

export interface RevealedInfoCardSide {
  readonly avatar: React.ReactNode
  readonly name: string
  readonly phoneNumber?: string
  readonly onAvatarPress?: () => void
}

export interface RevealedInfoCardProps {
  readonly title: string
  readonly description?: string
  readonly leftSide: RevealedInfoCardSide
  readonly rightSide: RevealedInfoCardSide
  /** Rendered full-width below the sides, e.g. an "Add to contacts" button. */
  readonly action?: React.ReactNode
}

function RevealedInfoCardSideView({
  avatar,
  name,
  phoneNumber,
  onAvatarPress,
}: RevealedInfoCardSide): React.JSX.Element {
  return (
    <YStack alignItems="center" flex={1} gap="$2">
      {onAvatarPress ? (
        <TouchableOpacity onPress={onAvatarPress}>{avatar}</TouchableOpacity>
      ) : (
        avatar
      )}
      <YStack alignItems="center" gap="$1">
        <Typography
          color="$foregroundPrimary"
          textAlign="center"
          variant="paragraphSmall"
        >
          {name}
        </Typography>
        {phoneNumber ? (
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="micro"
          >
            {phoneNumber}
          </Typography>
        ) : null}
      </YStack>
    </YStack>
  )
}

export function RevealedInfoCard({
  title,
  description,
  leftSide,
  rightSide,
  action,
}: RevealedInfoCardProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack
      alignItems="center"
      backgroundColor="$backgroundSecondary"
      borderRadius="$6"
      gap="$5"
      padding="$5"
      width="100%"
    >
      <YStack alignItems="center" gap="$1">
        <Typography
          color="$foregroundPrimary"
          textAlign="center"
          variant="micro"
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="paragraphSmall"
          >
            {description}
          </Typography>
        ) : null}
      </YStack>
      <XStack alignItems="center" gap="$4" width="100%">
        <RevealedInfoCardSideView {...leftSide} />
        <ArrowsHorizontal color={theme.foregroundPrimary.get()} size={28} />
        <RevealedInfoCardSideView {...rightSide} />
      </XStack>
      {action}
    </YStack>
  )
}
