import React from 'react'
import {ActivityIndicator, Platform} from 'react-native'
import {useTheme} from 'tamagui'

export type LoaderSize = 'small' | 'medium' | 'large'

export interface LoaderProps {
  readonly size?: LoaderSize
  readonly color?: string
}

const sizeMap: Record<LoaderSize, number> = {
  small: 16,
  medium: 24,
  large: 40,
}

export function Loader({
  size = 'medium',
  color,
}: LoaderProps): React.JSX.Element {
  const theme = useTheme()
  const resolvedColor = color ?? theme.accentYellowPrimary.get()

  if (Platform.OS === 'android') {
    return <ActivityIndicator size={sizeMap[size]} color={resolvedColor} />
  }

  return (
    <ActivityIndicator
      size={size === 'large' ? 'large' : 'small'}
      color={resolvedColor}
    />
  )
}
