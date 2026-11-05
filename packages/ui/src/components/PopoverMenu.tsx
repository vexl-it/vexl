import React from 'react'
import {styled, useTheme} from 'tamagui'

import {tokens} from '../config/tokens'
import type {IconProps} from '../icons/types'
import {Stack, XStack} from '../primitives'
import {Typography} from './Typography'

export const POPOVER_SHADOW = '0 4px 16px rgba(0, 0, 0, 0.12)'
export const POPOVER_MENU_WIDTH = tokens.size[13].val * 2.5
const POPOVER_MENU_ITEM_HEIGHT = tokens.size[10].val
const POPOVER_MENU_PADDING = tokens.space[2].val

/** Lets callers place the menu before it is laid out. */
export function getPopoverMenuHeight(itemsCount: number): number {
  return POPOVER_MENU_ITEM_HEIGHT * itemsCount + POPOVER_MENU_PADDING * 2
}

/** Floating menu surface for actions shown over a dimmed screen. */
export const PopoverMenu = styled(Stack, {
  name: 'PopoverMenu',
  width: POPOVER_MENU_WIDTH,
  paddingVertical: POPOVER_MENU_PADDING,
  borderRadius: '$6',
  overflow: 'hidden',
  backgroundColor: '$backgroundOnBar',
  boxShadow: POPOVER_SHADOW,
})

export interface PopoverMenuItemProps {
  readonly icon: React.ComponentType<IconProps>
  readonly label: string
  readonly onPress: () => void
}

export function PopoverMenuItem({
  icon: Icon,
  label,
  onPress,
}: PopoverMenuItemProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack
      role="button"
      height={POPOVER_MENU_ITEM_HEIGHT}
      alignItems="center"
      gap="$4"
      px="$5"
      pressStyle={{backgroundColor: '$backgroundSecondary'}}
      onPress={onPress}
    >
      <Icon size={20} color={theme.foregroundPrimary.get()} />
      <Typography variant="paragraph" color="$foregroundPrimary">
        {label}
      </Typography>
    </XStack>
  )
}
