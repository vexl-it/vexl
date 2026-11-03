import React from 'react'
import {ActivityIndicator, Platform} from 'react-native'
import {getTokens, useTheme} from 'tamagui'

export type LoaderSize = 'small' | 'medium' | 'large'

export interface LoaderProps {
  readonly size?: LoaderSize
  readonly color?: string
}

const sizeToken = {
  small: '$5',
  medium: '$7',
  large: '$9',
} as const satisfies Record<LoaderSize, string>

export function Loader({
  size = 'medium',
  color,
}: LoaderProps): React.JSX.Element {
  const theme = useTheme()
  const resolvedColor = color ?? theme.accentYellowPrimary.get()

  if (Platform.OS === 'android') {
    return (
      <ActivityIndicator
        size={getTokens().size[sizeToken[size]].val}
        color={resolvedColor}
      />
    )
  }

  return (
    <ActivityIndicator
      size={size === 'large' ? 'large' : 'small'}
      color={resolvedColor}
    />
  )
}
