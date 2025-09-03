import React from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, type YStackProps} from 'tamagui'

interface Props extends YStackProps {
  children: React.ReactElement | React.ReactElement[]
  customHorizontalPadding?: number
  customVerticalPadding?: number
}

function Screen({
  children,
  customHorizontalPadding = 0,
  customVerticalPadding = 0,
  ...props
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets()
  return (
    <Stack
      f={1}
      bc={props.backgroundColor ?? '$black'}
      pr={Math.max(insets.right, customHorizontalPadding)}
      pl={Math.max(insets.left, customHorizontalPadding)}
      pt={Math.max(insets.top, customVerticalPadding)}
      pb={Math.max(insets.bottom, customVerticalPadding)}
      {...props}
    >
      {children}
    </Stack>
  )
}

export default Screen
