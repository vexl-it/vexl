import React from 'react'
import {Platform} from 'react-native'

import {YStack} from '../primitives'
import {Typography} from './Typography'

const monospaceFontFamily = Platform.select({
  ios: 'Menlo',
  default: 'monospace',
})

export interface CodeBlockProps {
  readonly children: string
  readonly selectable?: boolean
}

export function CodeBlock({
  children,
  selectable = true,
}: CodeBlockProps): React.JSX.Element {
  return (
    <YStack
      backgroundColor="$backgroundTertiary"
      borderRadius="$4"
      padding="$3"
    >
      <Typography
        variant="micro"
        color="$foregroundPrimary"
        fontFamily={monospaceFontFamily}
        userSelect={selectable ? 'text' : 'none'}
      >
        {children}
      </Typography>
    </YStack>
  )
}
