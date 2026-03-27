import React from 'react'
import {styled} from 'tamagui'

import {SizableText, XStack} from '../primitives'

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

const leftShape = {
  borderTopLeftRadius: '$4',
  borderTopRightRadius: '$1',
  borderBottomLeftRadius: '$1',
  borderBottomRightRadius: '$4',
}

const rightShape = {
  borderTopLeftRadius: '$1',
  borderTopRightRadius: '$4',
  borderBottomLeftRadius: '$4',
  borderBottomRightRadius: '$1',
}

const TextTagFrame = styled(XStack, {
  name: 'TextTag',
  alignItems: 'center',
  overflow: 'hidden',
  paddingHorizontal: '$3',
  paddingVertical: '$2',

  variants: {
    variant: {
      offer: {backgroundColor: '$pinkBackground', ...leftShape},
      request: {backgroundColor: '$greenBackground', ...leftShape},
      approved: {backgroundColor: '$greenBackground', ...rightShape},
      waiting: {backgroundColor: '$accentYellowSecondary', ...rightShape},
      new: {backgroundColor: '$pinkBackground', ...rightShape},
      paused: {backgroundColor: '$redBackground', ...rightShape},
      set: {backgroundColor: '$greenBackground', ...rightShape},
      accepted: {backgroundColor: '$greenBackground', ...rightShape},
      waitingForConfirmation: {
        backgroundColor: '$pinkBackground',
        ...rightShape,
      },
      outdated: {backgroundColor: '$backgroundHighlight', ...rightShape},
    },
  } as const,
})

const TextTagLabel = styled(SizableText, {
  name: 'TextTagLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',

  variants: {
    variant: {
      offer: {color: '$pinkForeground'},
      request: {color: '$greenForeground'},
      approved: {color: '$greenForeground'},
      waiting: {color: '$accentHighlightSecondary'},
      new: {color: '$pinkForeground'},
      paused: {color: '$foregroundSecondary'},
      set: {color: '$greenForeground'},
      accepted: {color: '$greenForeground'},
      waitingForConfirmation: {color: '$pinkForeground'},
      outdated: {color: '$foregroundPrimary'},
    },
  } as const,
})

type TextTagFrameProps = React.ComponentProps<typeof TextTagFrame>

interface TextTagProps extends Omit<TextTagFrameProps, 'children' | 'variant'> {
  readonly label: string
  readonly variant: TextTagVariant
}

export function TextTag({
  label,
  variant,
  ...rest
}: TextTagProps): React.JSX.Element {
  return (
    <TextTagFrame variant={variant} {...rest}>
      <TextTagLabel variant={variant}>{label}</TextTagLabel>
    </TextTagFrame>
  )
}
