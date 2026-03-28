import React from 'react'
import {styled, useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import type {IconProps} from '../icons/types'
import {SizableText, XStack, YStack} from '../primitives'
import {MenuContext} from './Menu'

const MenuItemFrame = styled(XStack, {
  name: 'MenuItem',
  role: 'button',
  alignItems: 'center',
  gap: '$4',
  paddingHorizontal: '$4',
  paddingVertical: '$5',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',

  pressStyle: {
    opacity: 0.7,
  },

  variants: {
    contained: {
      true: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
    },
  } as const,
})

const MenuItemLabel = styled(SizableText, {
  name: 'MenuItemLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  letterSpacing: '$4',
  lineHeight: '$4',
  color: '$foregroundPrimary',

  variants: {
    variant: {
      default: {},
      danger: {color: '$redForeground'},
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})

const MenuItemNote = styled(SizableText, {
  name: 'MenuItemNote',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  color: '$foregroundSecondary',

  variants: {
    variant: {
      default: {},
      danger: {color: '$redForeground'},
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})

export type MenuItemVariant = 'default' | 'danger'

export interface MenuItemProps {
  readonly label: string
  readonly note?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly showChevron?: boolean
  readonly tag?: React.ReactNode
  readonly variant?: MenuItemVariant
  readonly onPress?: () => void
}

export function MenuItem({
  label,
  note,
  icon: Icon,
  showChevron = true,
  tag,
  variant = 'default',
  onPress,
}: MenuItemProps): React.JSX.Element {
  const inMenu = React.useContext(MenuContext)
  const theme = useTheme()

  const iconColor =
    variant === 'danger' ? theme.redForeground.val : theme.foregroundPrimary.val
  const chevronColor =
    variant === 'danger'
      ? theme.redForeground.val
      : theme.foregroundSecondary.val

  return (
    <MenuItemFrame contained={inMenu} onPress={onPress}>
      {Icon ? <Icon color={iconColor} size={24} /> : null}
      <YStack flex={1} gap="$1" justifyContent="center">
        <MenuItemLabel variant={variant}>{label}</MenuItemLabel>
        {note ? <MenuItemNote variant={variant}>{note}</MenuItemNote> : null}
      </YStack>
      {tag ?? null}
      {showChevron ? <ChevronRight color={chevronColor} size={24} /> : null}
    </MenuItemFrame>
  )
}
