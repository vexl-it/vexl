import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, type YStackProps} from 'tamagui'

interface Props extends YStackProps {
  backgroundColor?: string
  children: JSX.Element | JSX.Element[]
  customHorizontalPadding?: number
  customVerticalPadding?: number
}

function Screen({
  children,
  customHorizontalPadding = 0,
  customVerticalPadding = 0,
  ...props
}: Props): JSX.Element {
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
