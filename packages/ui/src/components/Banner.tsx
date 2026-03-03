import React from 'react'
import {styled} from 'tamagui'

import {SizableText, Stack, XStack, YStack} from '../primitives'

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

const TitleText = styled(SizableText, {
  name: 'BannerTitle',
  fontFamily: '$heading',
  fontWeight: '700',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundPrimary',
  flex: 1,
})

const DescriptionText = styled(SizableText, {
  name: 'BannerDescription',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundSecondary',
})

const PrimaryButtonFrame = styled(XStack, {
  name: 'BannerPrimaryButton',
  backgroundColor: '$black100',
  height: '$8',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$4',
  borderRadius: '$3',
  pressStyle: {
    opacity: 0.7,
  },
})

const PrimaryButtonLabel = styled(SizableText, {
  name: 'BannerPrimaryButtonLabel',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$white100',
})

const SecondaryButtonFrame = styled(XStack, {
  name: 'BannerSecondaryButton',
  height: '$8',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$4',
  borderRadius: '$3',
  pressStyle: {
    opacity: 0.7,
  },
})

const SecondaryButtonLabel = styled(SizableText, {
  name: 'BannerSecondaryButtonLabel',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundPrimary',
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
        <TitleText>{title}</TitleText>
        <DescriptionText>{description}</DescriptionText>
        {primaryButton != null || secondaryButton != null ? (
          <XStack gap="$3">
            {primaryButton != null ? (
              <PrimaryButtonFrame onPress={primaryButton.onPress}>
                <PrimaryButtonLabel>{primaryButton.label}</PrimaryButtonLabel>
              </PrimaryButtonFrame>
            ) : null}
            {secondaryButton != null ? (
              <SecondaryButtonFrame onPress={secondaryButton.onPress}>
                <SecondaryButtonLabel>
                  {secondaryButton.label}
                </SecondaryButtonLabel>
              </SecondaryButtonFrame>
            ) : null}
          </XStack>
        ) : null}
      </YStack>
    </BannerFrame>
  )
}
