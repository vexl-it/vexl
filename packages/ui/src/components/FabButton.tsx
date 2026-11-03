import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {Stack} from '../primitives'
import {Typography} from './Typography'

const FabButtonFrame = styled(Stack, {
  name: 'FabButton',
  role: 'button',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$accentYellowPrimary',
  padding: '$5',
  gap: '$3',
  borderRadius: '$4',

  pressStyle: {
    opacity: 0.7,
  },

  variants: {
    floating: {
      true: {
        position: 'absolute',
        bottom: '$5',
        right: '$5',
      },
    },
  } as const,
})

type FabButtonFrameProps = React.ComponentProps<typeof FabButtonFrame>

interface FabButtonProps extends Omit<FabButtonFrameProps, 'children'> {
  readonly icon: React.ComponentType<IconProps>
  readonly label: string
}

export function FabButton({
  icon: Icon,
  label,
  ...rest
}: FabButtonProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <FabButtonFrame {...rest}>
      {/* intentionally not theme-switching - black on the yellow accent in both themes */}
      <Icon color={theme.black100.get()} size={getTokens().size.$7.val} />
      <Typography variant="titlesSmall" color="$black100">
        {label}
      </Typography>
    </FabButtonFrame>
  )
}
