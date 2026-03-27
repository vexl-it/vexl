import React from 'react'
import {styled} from 'tamagui'

import {SizableText, Stack, YStack} from '../primitives'

export interface BlogCardProps {
  readonly image: React.ReactNode
  readonly title: string
  readonly description: string
  readonly date: string
  readonly onPress?: () => void
}

const CardFrame = styled(YStack, {
  name: 'BlogCard',
  gap: '$0.5',

  variants: {
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
        },
      },
    },
  } as const,
})

const ImageFrame = styled(Stack, {
  name: 'BlogCardImage',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
  overflow: 'hidden',
})

const ContentFrame = styled(YStack, {
  name: 'BlogCardContent',
  backgroundColor: '$backgroundSecondary',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
  padding: '$4',
  overflow: 'hidden',
})

const TitleText = styled(SizableText, {
  name: 'BlogCardTitle',
  fontFamily: '$heading',
  fontWeight: '700',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundPrimary',
})

const DescriptionText = styled(SizableText, {
  name: 'BlogCardDescription',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundSecondary',
  numberOfLines: 3,
})

const DateText = styled(SizableText, {
  name: 'BlogCardDate',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundSecondary',
})

export function BlogCard({
  image,
  title,
  description,
  date,
  onPress,
}: BlogCardProps): React.JSX.Element {
  const isPressable = !!onPress

  return (
    <CardFrame pressable={isPressable} onPress={onPress}>
      <ImageFrame>{image}</ImageFrame>
      <ContentFrame>
        <YStack gap="$3">
          <TitleText>{title}</TitleText>
          <DescriptionText>{description}</DescriptionText>
          <DateText>{date}</DateText>
        </YStack>
      </ContentFrame>
    </CardFrame>
  )
}
