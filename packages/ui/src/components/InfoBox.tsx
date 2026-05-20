import React from 'react'
import {styled, useTheme} from 'tamagui'

import {InfoCircle} from '../icons/InfoCircle'
import {XStack} from '../primitives'
import {Typography} from './Typography'

export type InfoBoxVariant =
  | 'default'
  | 'gray'
  | 'yellow'
  | 'pink'
  | 'tertiary'
  | 'naked'

const InfoBoxFrame = styled(XStack, {
  name: 'InfoBox',
  alignItems: 'center',
  gap: '$2',
  paddingHorizontal: '$4',
  paddingVertical: '$5',
  borderRadius: '$3',
  backgroundColor: '$backgroundSecondary',

  variants: {
    variant: {
      default: {
        backgroundColor: '$backgroundSecondary',
      },
      gray: {
        backgroundColor: '$backgroundSecondary',
      },
      yellow: {
        backgroundColor: '$accentYellowSecondary',
      },
      pink: {
        backgroundColor: '$pinkBackground',
      },
      tertiary: {
        backgroundColor: '$backgroundTertiary',
      },
      naked: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
    },
  },

  defaultVariants: {
    variant: 'default',
  },
})

type InfoBoxFrameProps = React.ComponentProps<typeof InfoBoxFrame>

export interface InfoBoxProps
  extends Omit<InfoBoxFrameProps, 'children' | 'variant'> {
  readonly children: string
  readonly variant?: InfoBoxVariant
  readonly iconSize?: number
  readonly textMt?: React.ComponentProps<typeof Typography>['mt']
}

export function InfoBox({
  children,
  variant = 'default',
  iconSize = 18,
  textMt = '$2',
  ...rest
}: InfoBoxProps): React.JSX.Element {
  const theme = useTheme()
  const foregroundColor =
    variant === 'yellow'
      ? theme.accentHighlightSecondary.get()
      : variant === 'pink'
        ? theme.pinkForeground.get()
        : theme.foregroundSecondary.get()
  const textColor =
    variant === 'yellow'
      ? '$accentHighlightSecondary'
      : variant === 'pink'
        ? '$pinkForeground'
        : '$foregroundSecondary'

  return (
    <InfoBoxFrame variant={variant} {...rest}>
      <InfoCircle color={foregroundColor} size={iconSize} />
      <Typography mt={textMt} color={textColor} flex={1} variant="description">
        {children}
      </Typography>
    </InfoBoxFrame>
  )
}
