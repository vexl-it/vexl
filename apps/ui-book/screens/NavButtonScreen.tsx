import {
  BellNotification,
  NavButton,
  type NavButtonVariant,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const variants: readonly NavButtonVariant[] = [
  'highlighted',
  'destructive',
  'normal',
  'secondary',
  'transparent',
]

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Icon type
      </Typography>
      <XStack gap="$3" flexWrap="wrap">
        {pipe(
          variants,
          Array.map((variant) => (
            <NavButton
              key={variant}
              variant={variant}
              icon={BellNotification}
              onPress={() => {}}
            />
          ))
        )}
      </XStack>

      <Typography variant="descriptionBold" color="$foregroundSecondary">
        With badge / disabled
      </Typography>
      <XStack gap="$3">
        <NavButton
          variant="secondary"
          icon={BellNotification}
          badge
          onPress={() => {}}
        />
        <NavButton icon={BellNotification} disabled onPress={() => {}} />
      </XStack>

      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Text type
      </Typography>
      <XStack gap="$3" flexWrap="wrap">
        {pipe(
          variants,
          Array.map((variant) => (
            <NavButton
              key={variant}
              variant={variant}
              type="text"
              onPress={() => {}}
            >
              Label
            </NavButton>
          ))
        )}
      </XStack>
    </YStack>
  )
}

export function NavButtonScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Nav Button" demos={Demos} />
}
