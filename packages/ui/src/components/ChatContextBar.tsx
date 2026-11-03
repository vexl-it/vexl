import {Array, pipe} from 'effect'
import React from 'react'
import type {GestureResponderEvent} from 'react-native'

import type {IconProps} from '../icons/types'
import {XStack, YStack} from '../primitives'
import {DotSeparatedRow} from './DotSeparatedRow'
import {NavButton} from './NavButton'
import {Typography} from './Typography'

export interface ChatContextBarProps {
  readonly title?: string
  /** Single-line text under the title. */
  readonly subtitle?: string
  /** Short facts under the title, separated by dots. */
  readonly meta?: readonly string[]
  readonly actionIcon: React.ComponentType<IconProps>
  readonly onActionPress: (event: GestureResponderEvent) => void
  readonly onPress: () => void
}

export function ChatContextBar({
  title,
  subtitle,
  meta = [],
  actionIcon,
  onActionPress,
  onPress,
}: ChatContextBarProps): React.JSX.Element {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      gap="$3"
      paddingVertical="$4"
      paddingHorizontal="$5"
      backgroundColor="$backgroundSecondary"
      onPress={onPress}
    >
      <YStack flex={1} gap="$2">
        {title ? (
          <Typography color="$foregroundPrimary" variant="paragraphSmallBold">
            {title}
          </Typography>
        ) : null}
        {subtitle ? (
          <Typography
            color="$foregroundSecondary"
            variant="description"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Typography>
        ) : null}
        {Array.isNonEmptyReadonlyArray(meta) ? (
          <DotSeparatedRow flexWrap="wrap">
            {pipe(
              meta,
              Array.map((item, index) => (
                <Typography
                  key={`${String(index)}-${item}`}
                  color="$foregroundSecondary"
                  variant="description"
                >
                  {item}
                </Typography>
              ))
            )}
          </DotSeparatedRow>
        ) : null}
      </YStack>
      <NavButton variant="normal" icon={actionIcon} onPress={onActionPress} />
    </XStack>
  )
}
