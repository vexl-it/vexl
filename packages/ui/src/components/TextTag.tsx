import React from 'react'
import {type ColorTokens, styled} from 'tamagui'

import {XStack} from '../primitives'
import {tagShapes} from './tagShapes'
import {Typography} from './Typography'

export type TextTagVariant =
  | 'offer'
  | 'request'
  | 'approved'
  | 'waiting'
  | 'new'
  | 'paused'
  | 'set'
  | 'accepted'
  | 'waitingForConfirmation'
  | 'outdated'
  | 'warning'
  | 'neutral'
  | 'success'
  | 'expired'
  | 'failed'

interface Tone {
  readonly backgroundColor: ColorTokens
  readonly color: ColorTokens
}

const tones = {
  pink: {backgroundColor: '$pinkBackground', color: '$pinkForeground'},
  green: {backgroundColor: '$greenBackground', color: '$greenForeground'},
  yellow: {
    backgroundColor: '$accentYellowSecondary',
    color: '$accentHighlightSecondary',
  },
  yellowContrast: {
    backgroundColor: '$accentYellowSecondary',
    color: '$accentHighlightPrimary',
  },
  red: {backgroundColor: '$redBackground', color: '$foregroundSecondary'},
  redContrast: {backgroundColor: '$redBackground', color: '$foregroundPrimary'},
  gray: {
    backgroundColor: '$backgroundHighlight',
    color: '$foregroundSecondary',
  },
  grayContrast: {
    backgroundColor: '$backgroundHighlight',
    color: '$foregroundPrimary',
  },
} as const satisfies Record<string, Tone>

interface TagStyle {
  readonly tone: keyof typeof tones
  readonly shape: keyof typeof tagShapes
  readonly size: 'regular' | 'status'
}

const variantStyles = {
  offer: {tone: 'pink', shape: 'left', size: 'regular'},
  request: {tone: 'green', shape: 'left', size: 'regular'},
  neutral: {tone: 'gray', shape: 'left', size: 'regular'},
  approved: {tone: 'green', shape: 'right', size: 'regular'},
  set: {tone: 'green', shape: 'right', size: 'regular'},
  accepted: {tone: 'green', shape: 'right', size: 'regular'},
  waiting: {tone: 'yellow', shape: 'right', size: 'regular'},
  new: {tone: 'pink', shape: 'right', size: 'regular'},
  waitingForConfirmation: {tone: 'pink', shape: 'right', size: 'regular'},
  paused: {tone: 'red', shape: 'right', size: 'regular'},
  outdated: {tone: 'grayContrast', shape: 'right', size: 'regular'},
  warning: {tone: 'yellowContrast', shape: 'left', size: 'status'},
  success: {tone: 'green', shape: 'left', size: 'status'},
  expired: {tone: 'grayContrast', shape: 'left', size: 'status'},
  failed: {tone: 'redContrast', shape: 'left', size: 'status'},
} as const satisfies Record<TextTagVariant, TagStyle>

const TextTagFrame = styled(XStack, {
  name: 'TextTag',
  alignItems: 'center',
  overflow: 'hidden',
  paddingHorizontal: '$3',

  variants: {
    shape: tagShapes,
    size: {
      regular: {paddingVertical: '$1'},
      status: {height: '$7', paddingVertical: '$2'},
    },
  } as const,
})

type TextTagFrameProps = React.ComponentProps<typeof TextTagFrame>

interface TextTagProps extends Omit<
  TextTagFrameProps,
  'children' | 'variant' | 'shape' | 'size'
> {
  readonly label: string
  readonly variant: TextTagVariant
}

export function TextTag({
  label,
  variant,
  ...rest
}: TextTagProps): React.JSX.Element {
  const {tone, shape, size} = variantStyles[variant]
  const {backgroundColor, color} = tones[tone]

  return (
    <TextTagFrame
      shape={shape}
      size={size}
      backgroundColor={backgroundColor}
      {...rest}
    >
      <Typography
        variant={size === 'status' ? 'micro' : 'description'}
        color={color}
      >
        {label}
      </Typography>
    </TextTagFrame>
  )
}
