import React from 'react'
import {getTokens, useTheme, type XStackProps} from 'tamagui'

import type {IconProps} from '../icons/types'
import {XStack} from '../primitives'
import {Typography} from './Typography'

export interface IconLabelProps extends Omit<XStackProps, 'children'> {
  readonly icon: React.ComponentType<IconProps>
  readonly label: string
}

export function IconLabel({
  icon: Icon,
  label,
  ...rest
}: IconLabelProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack gap="$1" alignItems="center" flexShrink={1} minWidth={0} {...rest}>
      <Icon
        size={getTokens().size.$5.val}
        color={theme.foregroundSecondary.get()}
      />
      <Typography
        variant="micro"
        color="$foregroundSecondary"
        numberOfLines={1}
        flexShrink={1}
      >
        {label}
      </Typography>
    </XStack>
  )
}
