import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'

interface Props {
  backgroundColor?: string
  children: JSX.Element | JSX.Element[]
  customHorizontalPadding?: number
  customVerticalPadding?: number
}

function Screen({
  backgroundColor = '$black',
  children,
  customHorizontalPadding = 0,
  customVerticalPadding = 0,
}: Props): JSX.Element {
  const insets = useSafeAreaInsets()
  return (
    <Stack
      f={1}
      bg={backgroundColor}
      pr={Math.max(insets.right, customHorizontalPadding)}
      pl={Math.max(insets.left, customHorizontalPadding)}
      pt={Math.max(insets.top, customVerticalPadding)}
      pb={Math.max(insets.bottom, customVerticalPadding)}
    >
      {children}
    </Stack>
  )
}

export default Screen
