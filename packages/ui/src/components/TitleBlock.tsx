import React from 'react'

import {YStack} from '../primitives'
import {Typography} from './Typography'

export type TitleBlockSize = 'small' | 'large'
export type TitleBlockAlign = 'left' | 'center'

export interface TitleBlockProps extends Omit<
  React.ComponentProps<typeof YStack>,
  'children'
> {
  readonly title?: React.ReactNode
  readonly text?: React.ReactNode
  readonly align?: TitleBlockAlign
  readonly size?: TitleBlockSize
}

export function TitleBlock({
  title,
  text,
  align = 'left',
  size = 'small',
  ...rest
}: TitleBlockProps): React.JSX.Element {
  const textAlign = align === 'center' ? 'center' : 'left'

  return (
    <YStack gap={size === 'large' ? '$4' : '$3'} alignSelf="stretch" {...rest}>
      {title !== undefined ? (
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          textAlign={textAlign}
        >
          {title}
        </Typography>
      ) : null}
      {text !== undefined ? (
        <Typography
          variant={size === 'large' ? 'paragraphSmall' : 'description'}
          color="$foregroundSecondary"
          textAlign={textAlign}
        >
          {text}
        </Typography>
      ) : null}
    </YStack>
  )
}
