import React from 'react'
import {
  RefreshControl as RNRefreshControl,
  type RefreshControlProps as RNRefreshControlProps,
} from 'react-native'
import {useTheme} from 'tamagui'

export type RefreshControlProps = Omit<
  RNRefreshControlProps,
  'tintColor' | 'colors' | 'progressBackgroundColor'
>

export function RefreshControl(props: RefreshControlProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <RNRefreshControl
      tintColor={theme.foregroundTertiary.get()}
      colors={[theme.foregroundPrimary.get()]}
      progressBackgroundColor={theme.backgroundSecondary.get()}
      {...props}
    />
  )
}
