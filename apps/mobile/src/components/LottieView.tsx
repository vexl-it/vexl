import RNLottieView, {type AnimatedLottieViewProps} from 'lottie-react-native'
import {Stack} from 'tamagui'
import {useMemo} from 'react'
import {type StyleProp, type ViewStyle} from 'react-native'

interface Props extends AnimatedLottieViewProps {}

function LottieView(props: Props): JSX.Element {
  const {style, ...restProps} = props
  const lottieViewStyles: StyleProp<ViewStyle> = useMemo(
    () => ({
      width: '100%',
      height: '100%',
    }),
    []
  )

  return (
    <Stack ai="center" jc="center" style={style}>
      <RNLottieView style={lottieViewStyles} {...restProps} />
    </Stack>
  )
}

export default LottieView
