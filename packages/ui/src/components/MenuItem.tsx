import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import type {IconProps} from '../icons/types'
import {XStack, YStack} from '../primitives'
import {MenuContext} from './Menu'
import {Typography} from './Typography'

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

  const isDanger = variant === 'danger'
  const iconSize = getTokens().size.$7.val
  const iconColor = isDanger
    ? theme.redForeground.get()
    : theme.foregroundPrimary.get()
  const chevronColor = isDanger
    ? theme.redForeground.get()
    : theme.foregroundSecondary.get()

  return (
    <MenuItemFrame contained={inMenu} onPress={onPress}>
      {Icon ? <Icon color={iconColor} size={iconSize} /> : null}
      <YStack flex={1} gap="$1" justifyContent="center">
        <Typography
          variant="paragraph"
          color={isDanger ? '$redForeground' : '$foregroundPrimary'}
        >
          {label}
        </Typography>
        {note ? (
          <Typography
            variant="micro"
            color={isDanger ? '$redForeground' : '$foregroundSecondary'}
          >
            {note}
          </Typography>
        ) : null}
      </YStack>
      {tag ?? null}
      {showChevron ? (
        <ChevronRight color={chevronColor} size={iconSize} />
      ) : null}
    </MenuItemFrame>
  )
}
