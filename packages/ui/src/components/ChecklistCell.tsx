import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import {ClockTime} from '../icons/ClockTime'
import type {IconProps} from '../icons/types'
import {XStack, YStack} from '../primitives'
import {CompletedIconBox, IconBox} from './IconBox'
import {Typography} from './Typography'

export type ChecklistCellState = 'initial' | 'pending' | 'completed'

const ChecklistCellFrame = styled(XStack, {
  name: 'ChecklistCell',
  alignItems: 'center',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$5',
  paddingLeft: '$3',
  paddingRight: '$4',
  paddingVertical: '$3',
  gap: '$4',

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

export interface ChecklistCellProps {
  readonly state: ChecklistCellState
  readonly headline: string
  readonly subtitle?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly disabled?: boolean
  readonly pressable?: boolean
  readonly onPress?: () => void
}

export function ChecklistCell({
  state,
  headline,
  subtitle,
  icon: Icon,
  disabled = false,
  pressable,
  onPress,
}: ChecklistCellProps): React.JSX.Element {
  const theme = useTheme()
  const isPressable = !disabled && (pressable ?? state !== 'completed')

  const iconSize = getTokens().size.$7.val

  const leadingIcon = (() => {
    switch (state) {
      case 'completed':
        return <CompletedIconBox />
      case 'pending':
        return (
          <IconBox tone="highlight">
            <ClockTime
              color={theme.accentHighlightSecondary.get()}
              size={iconSize}
            />
          </IconBox>
        )
      case 'initial':
        return (
          <IconBox tone="tertiary">
            {Icon ? (
              <Icon color={theme.foregroundPrimary.get()} size={iconSize} />
            ) : null}
          </IconBox>
        )
    }
  })()

  return (
    <ChecklistCellFrame
      pressable={isPressable}
      onPress={isPressable ? onPress : undefined}
      opacity={1}
    >
      {leadingIcon}
      <YStack flex={1} gap="$2">
        <Typography variant="descriptionBold" color="$foregroundPrimary">
          {headline}
        </Typography>
        {subtitle ? (
          <Typography
            variant="micro"
            color="$foregroundSecondary"
            numberOfLines={1}
          >
            {subtitle}
          </Typography>
        ) : null}
      </YStack>
      {isPressable ? (
        <ChevronRight color={theme.foregroundSecondary.get()} size={iconSize} />
      ) : null}
    </ChecklistCellFrame>
  )
}
