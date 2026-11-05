import React from 'react'

import {Circle, XStack, YStack} from '../primitives'
import {TwoToneCard} from './TwoToneCard'
import {Typography} from './Typography'

export interface NotificationCardProps {
  readonly avatar: React.ReactNode
  readonly name: string
  readonly time: string
  readonly category: string
  readonly message: string
  readonly tag?: React.ReactNode
  readonly children?: React.ReactNode
  readonly onPress?: () => void
}

export function NotificationCard({
  avatar,
  name,
  time,
  category,
  message,
  tag,
  children,
  onPress,
}: NotificationCardProps): React.JSX.Element {
  return (
    <TwoToneCard onPress={onPress}>
      <TwoToneCard.Header flexDirection="row" alignItems="flex-start">
        <XStack flex={1} gap="$3" alignItems="center" overflow="hidden">
          {avatar}
          <YStack gap="$1" flexShrink={1}>
            <Typography
              variant="descriptionBold"
              color="$foregroundPrimary"
              numberOfLines={1}
            >
              {name}
            </Typography>
            <XStack gap="$2" alignItems="center">
              <Typography variant="micro" color="$foregroundSecondary">
                {time}
              </Typography>
              <Circle size="$2" backgroundColor="$foregroundSecondary" />
              <Typography variant="micro" color="$foregroundSecondary">
                {category}
              </Typography>
            </XStack>
          </YStack>
        </XStack>
        {tag ?? null}
      </TwoToneCard.Header>
      <TwoToneCard.Content>
        <Typography variant="description" color="$foregroundSecondary">
          {message}
        </Typography>
        {children}
      </TwoToneCard.Content>
    </TwoToneCard>
  )
}
