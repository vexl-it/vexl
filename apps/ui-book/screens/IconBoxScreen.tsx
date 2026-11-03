import {
  CompletedIconBox,
  IconBox,
  type IconBoxProps,
  PencilWriteEdit,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'
import {getTokens} from 'tamagui'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const tones: ReadonlyArray<NonNullable<IconBoxProps['tone']>> = [
  'secondary',
  'tertiary',
  'highlight',
  'accent',
  'green',
  'red',
]

function Demos(): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack gap="$3">
      <XStack gap="$3" flexWrap="wrap">
        {pipe(
          tones,
          Array.map((tone) => (
            <YStack key={tone} gap="$1" alignItems="center">
              <IconBox tone={tone}>
                <PencilWriteEdit
                  color={theme.foregroundPrimary.get()}
                  size={getTokens().size.$7.val}
                />
              </IconBox>
              <Typography variant="micro" color="$foregroundSecondary">
                {tone}
              </Typography>
            </YStack>
          ))
        )}
      </XStack>
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        CompletedIconBox
      </Typography>
      <CompletedIconBox />
    </YStack>
  )
}

export function IconBoxScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Icon Box" demos={Demos} />
}
