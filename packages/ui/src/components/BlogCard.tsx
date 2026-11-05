import React from 'react'

import {Image, YStack} from '../primitives'
import {TwoToneCard} from './TwoToneCard'
import {Typography} from './Typography'

const IMAGE_HEIGHT = 162

export interface BlogCardProps {
  /** Without it, the image area shows an empty placeholder. */
  readonly imageUri?: string
  readonly title: string
  readonly description: string
  readonly date: string
  readonly onPress?: () => void
}

export function BlogCard({
  imageUri,
  title,
  description,
  date,
  onPress,
}: BlogCardProps): React.JSX.Element {
  return (
    <TwoToneCard onPress={onPress}>
      <TwoToneCard.Header padding="$0" height={IMAGE_HEIGHT} overflow="hidden">
        {imageUri !== undefined ? (
          <Image
            source={{uri: imageUri}}
            width="100%"
            height={IMAGE_HEIGHT}
            objectFit="cover"
          />
        ) : null}
      </TwoToneCard.Header>
      <TwoToneCard.Content>
        <YStack gap="$3">
          <Typography variant="tabSmallBold" color="$foregroundPrimary">
            {title}
          </Typography>
          <Typography
            variant="description"
            color="$foregroundSecondary"
            numberOfLines={3}
          >
            {description}
          </Typography>
          <Typography variant="micro" color="$foregroundSecondary">
            {date}
          </Typography>
        </YStack>
      </TwoToneCard.Content>
    </TwoToneCard>
  )
}
