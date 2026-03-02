import React from 'react'
import {Checkbox, styled, useTheme} from 'tamagui'

import {CheckboxFilled} from '../icons/CheckboxFilled'
import {SquareOutline} from '../icons/SquareOutline'
import {SizableText, XStack, YStack} from '../primitives'

const RowCheckboxFrame = styled(XStack, {
  name: 'RowCheckbox',
  role: 'button',
  alignItems: 'center',
  gap: '$3',
  padding: '$5',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',

  pressStyle: {
    opacity: 0.7,
  },

  variants: {
    selected: {
      true: {
        backgroundColor: '$accentYellowSecondary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

const RowCheckboxLabel = styled(SizableText, {
  name: 'RowCheckboxLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  letterSpacing: '$4',
  color: '$foregroundPrimary',

  variants: {
    selected: {
      true: {
        color: '$accentHighlightSecondary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

const RowCheckboxDescription = styled(SizableText, {
  name: 'RowCheckboxDescription',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  color: '$foregroundSecondary',

  variants: {
    selected: {
      true: {
        color: '$accentHighlightSecondary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

type RowCheckboxFrameProps = React.ComponentProps<typeof RowCheckboxFrame>

export interface RowCheckboxProps
  extends Omit<RowCheckboxFrameProps, 'children' | 'selected'> {
  readonly label: string
  readonly description?: string
  readonly checked?: boolean
  readonly onCheckedChange?: (checked: boolean) => void
}

export function RowCheckbox({
  label,
  description,
  checked = false,
  onCheckedChange,
  ...rest
}: RowCheckboxProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = checked
    ? theme.accentHighlightSecondary.val
    : theme.foregroundPrimary.val

  return (
    <RowCheckboxFrame
      selected={checked}
      onPress={() => {
        onCheckedChange?.(!checked)
      }}
      {...rest}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => {
          if (typeof next === 'boolean') {
            onCheckedChange?.(next)
          }
        }}
        unstyled
        width="$7"
        height="$7"
        backgroundColor="transparent"
        borderWidth={0}
        padding="$0"
      >
        <Checkbox.Indicator forceMount>
          {checked ? (
            <CheckboxFilled size={24} color={iconColor} />
          ) : (
            <SquareOutline size={24} color={iconColor} />
          )}
        </Checkbox.Indicator>
      </Checkbox>
      <YStack flex={1} gap="$1">
        <RowCheckboxLabel selected={checked}>{label}</RowCheckboxLabel>
        {description ? (
          <RowCheckboxDescription selected={checked}>
            {description}
          </RowCheckboxDescription>
        ) : null}
      </YStack>
    </RowCheckboxFrame>
  )
}
