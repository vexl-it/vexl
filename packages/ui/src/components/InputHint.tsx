import React from 'react'
import {styled, useTheme} from 'tamagui'

import {FlagReport} from '../icons/FlagReport'
import type {IconProps} from '../icons/types'
import {SizableText, XStack} from '../primitives'

const InputHintFrame = styled(XStack, {
  name: 'InputHint',
  alignItems: 'center',
  gap: '$2',
  paddingHorizontal: '$3',
})

export type InputHintVariant = 'default' | 'error'

export interface InputHintProps {
  readonly children: string
  readonly variant?: InputHintVariant
  readonly showIcon?: boolean
  readonly icon?: React.ComponentType<IconProps>
}

export function InputHint({
  children,
  variant = 'default',
  showIcon = true,
  icon: Icon = FlagReport,
}: InputHintProps): React.JSX.Element {
  const theme = useTheme()

  const color =
    variant === 'error'
      ? theme.redForeground.val
      : theme.foregroundSecondary.val

  return (
    <InputHintFrame>
      {showIcon ? <Icon size={24} color={color} /> : null}
      <SizableText
        fontFamily="$body"
        fontWeight="500"
        fontSize="$1"
        letterSpacing="$1"
        color={variant === 'error' ? '$redForeground' : '$foregroundSecondary'}
      >
        {children}
      </SizableText>
    </InputHintFrame>
  )
}
