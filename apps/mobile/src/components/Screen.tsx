import React from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, type YStackProps} from 'tamagui'

interface Props extends YStackProps {
  children: React.ReactElement | React.ReactElement[]
  customHorizontalPadding?: number
  customVerticalPadding?: number
  insetsColor?: YStackProps['backgroundColor']
}

function Screen({
  children,
  customHorizontalPadding = 0,
  customVerticalPadding = 0,
  insetsColor,
  ...props
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets()
  return (
    <Stack f={1} backgroundColor={insetsColor ?? props.backgroundColor}>
      <Stack
        f={1}
        bc={props.backgroundColor ?? '$'}
        mr={Math.max(insets.right, customHorizontalPadding)}
        ml={Math.max(insets.left, customHorizontalPadding)}
        mt={Math.max(insets.top, customVerticalPadding)}
        mb={Math.max(insets.bottom, customVerticalPadding)}
        {...props}
      >
        {children}
      </Stack>
    </Stack>
  )
}

export default Screen
