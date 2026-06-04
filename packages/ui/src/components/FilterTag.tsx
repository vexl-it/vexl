import React from 'react'
import {styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {SizableText, XStack} from '../primitives'
import {Dot} from './Dot'

const FilterTagFrame = styled(XStack, {
  name: 'FilterTag',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  borderRadius: '$3',
  backgroundColor: '$backgroundSecondary',
  position: 'relative',
  overflow: 'visible',

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

const FilterTagLabel = styled(SizableText, {
  name: 'FilterTagLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$3',
  letterSpacing: '$3',
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

type FilterTagFrameProps = React.ComponentProps<typeof FilterTagFrame>

interface FilterTagProps extends Omit<FilterTagFrameProps, 'children'> {
  readonly label: string
  readonly selected?: boolean
  readonly icon?: React.ComponentType<IconProps>
  readonly badge?: boolean
}

export function FilterTag({
  label,
  selected = false,
  icon: Icon,
  badge = false,
  ...rest
}: FilterTagProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = selected
    ? theme.accentHighlightPrimary.get()
    : theme.foregroundPrimary.get()

  return (
    <FilterTagFrame selected={selected} {...rest}>
      {Icon ? <Icon color={iconColor} size={16} /> : null}
      <FilterTagLabel selected={selected}>{label}</FilterTagLabel>
      {badge ? (
        <Dot position="absolute" top="$-1" right="$-1" size="$4" />
      ) : null}
    </FilterTagFrame>
  )
}
