import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import {surfaceShadow} from '../config/shadows'
import {tokens} from '../config/tokens'
import type {IconProps} from '../icons/types'
import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export const CONTEXT_MENU_WIDTH = 200

const ITEM_HEIGHT = tokens.size[10].val
const VERTICAL_PADDING = tokens.space[2].val

export function contextMenuHeight(itemsCount: number): number {
  return ITEM_HEIGHT * itemsCount + VERTICAL_PADDING * 2
}

export interface ContextMenuProps {
  readonly children: React.ReactNode
}

export function ContextMenu({children}: ContextMenuProps): React.JSX.Element {
  return (
    <YStack
      width={CONTEXT_MENU_WIDTH}
      paddingVertical={VERTICAL_PADDING}
      borderRadius="$6"
      overflow="hidden"
      backgroundColor="$backgroundOnBar"
      boxShadow={surfaceShadow}
    >
      {children}
    </YStack>
  )
}

export interface ContextMenuItemProps {
  readonly icon: React.ComponentType<IconProps>
  readonly label: string
  readonly onPress: () => void
}

export function ContextMenuItem({
  icon: Icon,
  label,
  onPress,
}: ContextMenuItemProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack
      role="button"
      height={ITEM_HEIGHT}
      alignItems="center"
      gap="$4"
      paddingHorizontal="$5"
      pressStyle={{backgroundColor: '$backgroundSecondary'}}
      onPress={onPress}
    >
      <Icon
        size={getTokens().size.$6.val}
        color={theme.foregroundPrimary.get()}
      />
      <Typography variant="paragraph" color="$foregroundPrimary">
        {label}
      </Typography>
    </XStack>
  )
}
