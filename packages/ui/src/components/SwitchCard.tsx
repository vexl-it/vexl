import type {SetStateAction, WritableAtom} from 'jotai'
import React from 'react'

import {XStack, YStack} from '../primitives'
import {Switch} from './Switch'
import {Typography} from './Typography'

export interface SwitchCardProps extends Omit<
  React.ComponentProps<typeof XStack>,
  'children'
> {
  readonly title: string
  readonly description?: string
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}

export function SwitchCard({
  title,
  description,
  valueAtom,
  ...rest
}: SwitchCardProps): React.JSX.Element {
  return (
    <XStack
      alignItems="center"
      gap="$4"
      padding="$5"
      borderRadius="$5"
      backgroundColor="$backgroundSecondary"
      {...rest}
    >
      <YStack flex={1} gap="$2">
        <Typography variant="paragraph" color="$foregroundPrimary">
          {title}
        </Typography>
        {description !== undefined ? (
          <Typography variant="micro" color="$foregroundSecondary">
            {description}
          </Typography>
        ) : null}
      </YStack>
      <Switch aria-label={title} valueAtom={valueAtom} />
    </XStack>
  )
}
