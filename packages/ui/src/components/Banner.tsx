import React from 'react'
import {styled} from 'tamagui'

import {Stack, XStack, YStack} from '../primitives'
import {CardButton} from './CardButton'
import {Typography} from './Typography'

export type BannerColor = 'green' | 'pink'

export interface BannerButton {
  readonly label: string
  readonly onPress?: () => void
}

export interface BannerProps {
  readonly color?: BannerColor
  readonly title: string
  readonly description: string
  readonly image?: React.ReactNode
  readonly primaryButton?: BannerButton
  readonly secondaryButton?: BannerButton
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
    },
  },

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
  primaryButton,
  secondaryButton,
}: BannerProps): React.JSX.Element {
  return (
    <BannerFrame color={color}>
      {image != null ? <ImageFrame>{image}</ImageFrame> : null}
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
    </BannerFrame>
  )
}
