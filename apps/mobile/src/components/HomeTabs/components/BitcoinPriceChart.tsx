import styled from '@emotion/native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

export const CHART_HEIGHT_PX = 100

const RootContainer = styled.View`
  height: ${CHART_HEIGHT_PX.toString()}px;
`

const Content = styled.View`
  flex: 1;
`

function BitcoinPriceChart(): JSX.Element {
  const insets = useSafeAreaInsets()

  return (
    <RootContainer>
      <Content style={{paddingTop: insets.top}} />
    </RootContainer>
  )
}

export default BitcoinPriceChart

// linear-gradient(180deg, #FCCD6C 0%, rgba(252, 205, 108, 0) 100%);
