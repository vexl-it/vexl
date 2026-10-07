import React from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import {styled, useTheme, type GenericStackVariants} from 'tamagui'

import {UserImagePlaceholder} from '../assets/UserImagePlaceholder'
import {SizableText, Stack, XStack} from '../primitives'
import {Avatar} from './Avatar'
import {TrustBadge} from './TrustBadge'

export interface ChipProps {
  readonly name: string
  readonly avatarSource?: RNImageProps['source']
  readonly trusted?: boolean
}

const AVATAR_SIZE = 16
const TRUST_BADGE_SIZE = 10

const ChipFrame = styled(XStack, {
  name: 'Chip',
  backgroundColor: '$backgroundTertiary',
  borderRadius: '$2',
  padding: '$2',
  gap: '$2',
  alignItems: 'center',
  alignSelf: 'flex-start',
  overflow: 'hidden',
  flexShrink: 0,
  variants: {
    trusted: {
      true: {
        backgroundColor: '$accentYellowSecondary',
        overflow: 'visible',
      },
    },
  } satisfies GenericStackVariants,
})

export function Chip({
  name,
  avatarSource,
  trusted = false,
}: ChipProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <ChipFrame trusted={trusted}>
      <Stack>
        <Avatar source={avatarSource} customSize={AVATAR_SIZE}>
          <UserImagePlaceholder size={AVATAR_SIZE} />
        </Avatar>
        {trusted ? (
          <TrustBadge
            variant="overlay"
            size={TRUST_BADGE_SIZE}
            ringColor={theme.accentYellowSecondary.get()}
          />
        ) : null}
      </Stack>
      <SizableText
        fontFamily="$body"
        fontWeight="500"
        fontSize="$1"
        letterSpacing="$1"
        lineHeight="$1"
        color={trusted ? '$foregroundPrimary' : '$foregroundSecondary'}
        numberOfLines={1}
      >
        {name}
      </SizableText>
    </ChipFrame>
  )
}
