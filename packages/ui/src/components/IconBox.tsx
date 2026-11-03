import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import {Stack} from '../primitives'

export const IconBox = styled(Stack, {
  name: 'IconBox',
  width: '$9',
  height: '$9',
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    tone: {
      secondary: {backgroundColor: '$backgroundSecondary'},
      tertiary: {backgroundColor: '$backgroundTertiary'},
      highlight: {backgroundColor: '$navigationBackgroundHighlight'},
      accent: {backgroundColor: '$accentYellowSecondary'},
      green: {backgroundColor: '$greenForeground'},
    },
  } as const,

  defaultVariants: {
    tone: 'tertiary',
  },
})

export type IconBoxProps = React.ComponentProps<typeof IconBox>

export function CompletedIconBox(): React.JSX.Element {
  const theme = useTheme()

  return (
    <IconBox tone="green">
      <RadiobuttonCircleFilled
        color={theme.backgroundSecondary.get()}
        size={getTokens().size.$7.val}
      />
    </IconBox>
  )
}
