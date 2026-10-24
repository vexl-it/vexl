import React from 'react'
import type {ImageProps} from 'react-native'

import {YStack} from '../primitives'
import {Avatar} from './Avatar'
import {Typography} from './Typography'

export interface RevealDeclinedCardProps {
  readonly imageSource: ImageProps['source']
  readonly title: string
  readonly description: string
}

export function RevealDeclinedCard({
  imageSource,
  title,
  description,
}: RevealDeclinedCardProps): React.JSX.Element {
  return (
    <YStack
      alignItems="center"
      backgroundColor="$backgroundSecondary"
      borderRadius="$6"
      gap="$1"
      paddingHorizontal="$5"
      paddingVertical="$4"
      width="100%"
    >
      <Avatar customSize={56} source={imageSource} />
      <Typography color="$foregroundPrimary" variant="paragraphDemibold">
        {title}
      </Typography>
      <Typography
        color="$foregroundSecondary"
        textAlign="center"
        variant="paragraphSmall"
      >
        {description}
      </Typography>
    </YStack>
  )
}
