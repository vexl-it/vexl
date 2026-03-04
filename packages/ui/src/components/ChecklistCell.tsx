import React from 'react'
import {styled, useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import {ClockTime} from '../icons/ClockTime'
import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import type {IconProps} from '../icons/types'
import {SizableText, Stack, XStack, YStack} from '../primitives'

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

const IconBox = styled(Stack, {
  name: 'ChecklistCellIconBox',
  width: '$9',
  height: '$9',
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
})

const HeadlineText = styled(SizableText, {
  name: 'ChecklistCellHeadline',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundPrimary',
})

const SubtitleText = styled(SizableText, {
  name: 'ChecklistCellSubtitle',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundSecondary',
  numberOfLines: 1,
})

export interface ChecklistCellProps {
  readonly state: ChecklistCellState
  readonly headline: string
  readonly subtitle?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly onPress?: () => void
}

export function ChecklistCell({
  state,
  headline,
  subtitle,
  icon: Icon,
  onPress,
}: ChecklistCellProps): React.JSX.Element {
  const theme = useTheme()
  const isPressable = state !== 'completed'

  const iconBoxBg = (() => {
    switch (state) {
      case 'completed':
        return theme.greenForeground.val
      case 'pending':
        return theme.navigationBackgroundHighlight.val
      case 'initial':
        return theme.backgroundTertiary.val
    }
  })()

  const renderIcon = (): React.JSX.Element | null => {
    switch (state) {
      case 'completed':
        return (
          <RadiobuttonCircleFilled
            color={theme.backgroundSecondary.val}
            size={24}
          />
        )
      case 'pending':
        return (
          <ClockTime color={theme.accentHighlightSecondary.val} size={24} />
        )
      case 'initial':
        return Icon ? (
          <Icon color={theme.foregroundPrimary.val} size={24} />
        ) : null
    }
  }

  return (
    <ChecklistCellFrame
      pressable={isPressable}
      onPress={isPressable ? onPress : undefined}
    >
      <IconBox backgroundColor={iconBoxBg}>{renderIcon()}</IconBox>
      <YStack flex={1} gap="$2">
        <HeadlineText>{headline}</HeadlineText>
        {subtitle ? <SubtitleText>{subtitle}</SubtitleText> : null}
      </YStack>
      {isPressable ? (
        <ChevronRight color={theme.foregroundSecondary.val} size={24} />
      ) : null}
    </ChecklistCellFrame>
  )
}
