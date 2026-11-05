import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import {ArrowsHorizontal} from '../icons/ArrowsHorizontal'
import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export interface ExchangeRevealCardSide {
  readonly avatar: React.ReactNode
  readonly name: string
  readonly subtitle?: string
  readonly onAvatarPress?: () => void
}

export interface ExchangeRevealCardProps extends Omit<
  React.ComponentProps<typeof YStack>,
  'children'
> {
  readonly title: string
  readonly description?: string
  readonly leftSide: ExchangeRevealCardSide
  readonly rightSide: ExchangeRevealCardSide
  readonly footer?: React.ReactNode
}

function Side({
  avatar,
  name,
  subtitle,
  onAvatarPress,
}: ExchangeRevealCardSide): React.JSX.Element {
  return (
    <YStack alignItems="center" flex={1} gap="$2">
      <Stack
        onPress={onAvatarPress}
        pressStyle={onAvatarPress ? {opacity: 0.7} : undefined}
        role={onAvatarPress ? 'button' : undefined}
      >
        {avatar}
      </Stack>
      <YStack alignItems="center" gap="$1">
        <Typography
          color="$foregroundPrimary"
          textAlign="center"
          variant="paragraphSmall"
        >
          {name}
        </Typography>
        {subtitle ? (
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="micro"
          >
            {subtitle}
          </Typography>
        ) : null}
      </YStack>
    </YStack>
  )
}

export function ExchangeRevealCard({
  title,
  description,
  leftSide,
  rightSide,
  footer,
  ...rest
}: ExchangeRevealCardProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack
      alignItems="center"
      backgroundColor="$backgroundSecondary"
      borderRadius="$6"
      gap="$5"
      padding="$5"
      {...rest}
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
        <Side {...leftSide} />
        <ArrowsHorizontal
          color={theme.foregroundPrimary.get()}
          size={getTokens().size.$7.val}
        />
        <Side {...rightSide} />
      </XStack>
      {footer}
    </YStack>
  )
}
