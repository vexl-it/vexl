import React from 'react'
import {useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import type {IconProps} from '../icons/types'
import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export interface SectionHeaderProps extends Omit<
  React.ComponentProps<typeof XStack>,
  'children'
> {
  readonly title: string
  readonly description?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly trailing?: React.ReactNode
  readonly onPress?: () => void
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  trailing,
  onPress,
  ...rest
}: SectionHeaderProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack
      alignItems="center"
      gap="$4"
      onPress={onPress}
      pressStyle={onPress ? {opacity: 0.7} : undefined}
      role={onPress ? 'button' : undefined}
      {...rest}
    >
      <YStack flex={1} gap="$1">
        <XStack alignItems="center" gap="$2">
          {Icon ? (
            <Icon size={24} color={theme.foregroundPrimary.get()} />
          ) : null}
          <Typography
            flexShrink={1}
            variant="titlesSmall"
            color="$foregroundPrimary"
          >
            {title}
          </Typography>
        </XStack>
        {description !== undefined ? (
          <Typography variant="description" color="$foregroundSecondary">
            {description}
          </Typography>
        ) : null}
      </YStack>
      {trailing}
      {onPress ? (
        <ChevronRight size={24} color={theme.foregroundSecondary.get()} />
      ) : null}
    </XStack>
  )
}
