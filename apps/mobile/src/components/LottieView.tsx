import RNLottieView, {type AnimatedLottieViewProps} from 'lottie-react-native'
import styled, {css} from '@emotion/native'

const RootContainer = styled.View`
  align-items: center;
  justify-content: center;
  display: flex;
`

interface Props extends AnimatedLottieViewProps {}

function LottieView(props: Props): JSX.Element {
  const {style, ...restProps} = props

  return (
    <RootContainer style={style}>
      <RNLottieView
        style={css`
          width: 100%;
          height: 100%;
        `}
        {...restProps}
      />
    </RootContainer>
  )
}

export default LottieView
