import React from 'react'
import {Platform, Text} from 'react-native'
import {useTheme} from 'tamagui'

import {bodyFont} from '../config/fonts'
import {YStack} from '../primitives'

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
  const theme = useTheme()

  return (
    <YStack
      backgroundColor="$backgroundTertiary"
      borderRadius="$4"
      padding="$3"
    >
      <Text
        selectable={selectable}
        style={{
          color: theme.foregroundPrimary.get(),
          fontFamily: monospaceFontFamily,
          fontSize: bodyFont.size[1],
          lineHeight: bodyFont.lineHeight[1],
        }}
      >
        {children}
      </Text>
    </YStack>
  )
}
