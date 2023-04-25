import {type AnimatedLottieViewProps} from 'lottie-react-native'
import {Stack} from 'tamagui'

interface Props extends AnimatedLottieViewProps {}

function LottieView(props: Props): JSX.Element {
  const {style} = props
  // const lottieViewStyles: StyleProp<ViewStyle> = useMemo(
  //   () => ({
  //     width: '100%',
  //     height: '100%',
  //   }),
  //   []
  // )

  return (
    <Stack ai="center" jc="center" style={style}>
      {/* <RNLottieView style={lottieViewStyles} {...restProps} /> */}
    </Stack>
  )
}

export default LottieView
