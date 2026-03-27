import React from 'react'
import {styled} from 'tamagui'

import {type TypographyVariant, typographyVariantStyles} from '../config/fonts'
import {SizableText} from '../primitives'

export type {TypographyVariant} from '../config/fonts'

const TypographyFrame = styled(SizableText, {
  name: 'Typography',

  variants: {
    variant: typographyVariantStyles,
  } as const,
})

type TypographyFrameProps = React.ComponentProps<typeof TypographyFrame>

export interface TypographyProps extends TypographyFrameProps {
  readonly children: React.ReactNode
  readonly variant: TypographyVariant
}

export function Typography({
  variant,
  children,
  ...rest
}: TypographyProps): React.JSX.Element {
  return (
    <TypographyFrame variant={variant} {...rest}>
      {children}
    </TypographyFrame>
  )
}
