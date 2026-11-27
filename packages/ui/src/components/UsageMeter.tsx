import React from 'react'
import {Pressable} from 'react-native'
import {getTokens, useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import {XStack, YStack} from '../primitives'
import {ProgressBar} from './ProgressBar'
import {Typography} from './Typography'

export interface UsageMeterProps {
  readonly used: number
  readonly total: number
  readonly label: string
  readonly action?: React.ReactNode
  readonly linkLabel: string
  readonly onLinkPress: () => void
}

export function UsageMeter({
  used,
  total,
  label,
  action,
  linkLabel,
  onLinkPress,
}: UsageMeterProps): React.JSX.Element {
  const theme = useTheme()
  return (
    <YStack gap="$3" px="$1">
      <XStack ai="center" jc="space-between" gap="$4">
        <Typography variant="description" color="$foregroundSecondary" f={1}>
          {label}
        </Typography>
        {action}
      </XStack>
      {used < total ? (
        <>
          <ProgressBar
            value={total > 0 ? used / total : 0}
            accessibilityLabel={label}
            accessibilityValue={{min: 0, max: total, now: used, text: label}}
          />
          <Pressable accessibilityRole="button" onPress={onLinkPress}>
            <XStack ai="center" gap="$1">
              <Typography variant="descriptionBold" color="$foregroundPrimary">
                {linkLabel}
              </Typography>
              <ChevronRight
                size={getTokens().size.$5.val}
                color={theme.foregroundPrimary.get()}
              />
            </XStack>
          </Pressable>
        </>
      ) : null}
    </YStack>
  )
}
