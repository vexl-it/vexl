import React from 'react'
import {styled, useTheme} from 'tamagui'

import {InfoCircle} from '../icons/InfoCircle'
import {Stack, XStack, YStack} from '../primitives'
import {CardButton} from './CardButton'
import {Typography} from './Typography'

export type BannerColor = 'green' | 'pink' | 'yellow' | 'neutral'

export interface BannerButton {
  readonly label: string
  readonly onPress?: () => void
}

export interface BannerProps {
  readonly color?: BannerColor
  readonly title: string
  readonly description: string
  readonly image?: React.ReactNode
  readonly leading?: React.ReactNode
  readonly primaryButton?: BannerButton
  readonly secondaryButton?: BannerButton
  readonly fillHeight?: boolean
}

const BannerFrame = styled(YStack, {
  name: 'Banner',
  padding: '$4',
  borderRadius: '$5',
  gap: '$5',
  overflow: 'hidden',

  variants: {
    color: {
      green: {
        backgroundColor: '$greenBackground',
      },
      pink: {
        backgroundColor: '$pinkBackground',
      },
      yellow: {
        backgroundColor: '$accentYellowSecondary',
      },
      neutral: {
        backgroundColor: '$backgroundSecondary',
      },
    },
    fillHeight: {
      true: {
        flexGrow: 1,
      },
    },
  } as const,

  defaultVariants: {
    color: 'green',
  },
})

const ImageFrame = styled(Stack, {
  name: 'BannerImage',
  borderRadius: '$3',
  overflow: 'hidden',
  alignSelf: 'stretch',
})

export function Banner({
  color = 'green',
  title,
  description,
  image,
  leading,
  primaryButton,
  secondaryButton,
  fillHeight,
}: BannerProps): React.JSX.Element {
  const content = (
    <YStack gap="$3">
      <Typography variant="tabSmallBold" color="$foregroundPrimary">
        {title}
      </Typography>
      <Typography variant="description" color="$foregroundSecondary">
        {description}
      </Typography>
      {primaryButton != null || secondaryButton != null ? (
        <XStack gap="$3">
          {primaryButton != null ? (
            <CardButton
              height={36}
              paddingVertical="$0"
              onPress={primaryButton.onPress}
            >
              {primaryButton.label}
            </CardButton>
          ) : null}
          {secondaryButton != null ? (
            <CardButton
              type="text"
              height={36}
              paddingVertical="$0"
              onPress={secondaryButton.onPress}
            >
              {secondaryButton.label}
            </CardButton>
          ) : null}
        </XStack>
      ) : null}
    </YStack>
  )

  return (
    <BannerFrame color={color} fillHeight={fillHeight}>
      {image != null ? <ImageFrame>{image}</ImageFrame> : null}
      {leading != null ? (
        <XStack f={1} gap="$4" ai="center">
          {leading}
          <YStack f={1}>{content}</YStack>
        </XStack>
      ) : (
        content
      )}
    </BannerFrame>
  )
}

export interface StatBannerProps {
  readonly color?: BannerColor
  readonly label: string
  readonly value: string
  readonly description: string
  readonly onPress?: () => void
  readonly fillHeight?: boolean
}

export function StatBanner({
  color = 'green',
  label,
  value,
  description,
  onPress,
  fillHeight,
}: StatBannerProps): React.JSX.Element {
  const theme = useTheme()
  return (
    <BannerFrame
      color={color}
      fillHeight={fillHeight}
      gap="$2"
      role={onPress != null ? 'button' : undefined}
      onPress={onPress}
    >
      <XStack ai="center" jc="space-between" gap="$3">
        <Typography variant="micro" color="$foregroundSecondary" f={1}>
          {label}
        </Typography>
        {onPress != null ? (
          <InfoCircle size={16} color={theme.foregroundSecondary.get()} />
        ) : null}
      </XStack>
      <Typography
        variant="heading3"
        color="$foregroundPrimary"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Typography>
      <Typography variant="description" color="$foregroundSecondary">
        {description}
      </Typography>
    </BannerFrame>
  )
}
