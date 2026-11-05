import {styled} from 'tamagui'

import {Stack} from '../primitives'

export const Backdrop = styled(Stack, {
  name: 'Backdrop',
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,

  variants: {
    variant: {
      dark: {
        backgroundColor: '$black100',
        opacity: 0.5,
      },
      surface: {
        backgroundColor: '$backgroundPrimary',
        opacity: 0.78,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'dark',
  },
})

export type BackdropVariant = 'dark' | 'surface'
