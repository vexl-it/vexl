import React from 'react'
import {RadioGroup, styled, useTheme} from 'tamagui'

import {RadiobuttonCircleEmpty} from '../icons/RadiobuttonCircleEmpty'
import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import {SizableText, XStack, YStack} from '../primitives'

const RowRadiobuttonLabel = styled(SizableText, {
  name: 'RowRadiobuttonLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  letterSpacing: '$4',
  color: '$foregroundPrimary',

  variants: {
    selected: {
      true: {
        color: '$accentHighlightPrimary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

const RowRadiobuttonDescription = styled(SizableText, {
  name: 'RowRadiobuttonDescription',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$2',
  letterSpacing: '$2',
  color: '$foregroundPrimary',

  variants: {
    selected: {
      true: {
        color: '$accentHighlightPrimary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

export interface RowRadiobuttonProps {
  readonly value: string
  readonly selected?: boolean
  readonly label: string
  readonly description?: string
  readonly disabled?: boolean
}

export function RowRadiobutton({
  value,
  selected = false,
  label,
  description,
  disabled,
}: RowRadiobuttonProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = selected
    ? theme.accentHighlightPrimary.val
    : theme.foregroundPrimary.val

  return (
    <RadioGroup.Item
      value={value}
      disabled={disabled}
      unstyled
      backgroundColor={
        selected ? '$accentYellowSecondary' : '$backgroundSecondary'
      }
      padding="$5"
      borderRadius="$5"
      gap="$3"
      pressStyle={{opacity: 0.7}}
    >
      <XStack gap="$3" alignItems="center">
        {selected ? (
          <RadiobuttonCircleFilled size={24} color={iconColor} />
        ) : (
          <RadiobuttonCircleEmpty size={24} color={iconColor} />
        )}
        <RowRadiobuttonLabel selected={selected} flex={1}>
          {label}
        </RowRadiobuttonLabel>
      </XStack>
      {description ? (
        <YStack paddingLeft="$8">
          <RowRadiobuttonDescription selected={selected}>
            {description}
          </RowRadiobuttonDescription>
        </YStack>
      ) : null}
    </RadioGroup.Item>
  )
}
