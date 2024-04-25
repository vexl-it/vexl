import {LinearGradient} from 'expo-linear-gradient'
import {Stack, styled} from 'tamagui'
import BitcoinPriceChart from './BitcoinPriceChart'
import {CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING} from './ContainerWithTopBorderRadius'

const CHART_HEADER_HEIGHT_PX = 80

const BackgroundImage = styled(LinearGradient, {
  w: '100%',
  h: '100%',
  o: 0.2,
  colors: ['rgba(252, 205, 108, 0)', '#FCCD6C'],
})

function BtcPriceHeader(): JSX.Element {
  return (
    <Stack h={CHART_HEADER_HEIGHT_PX}>
      <Stack
        bg="$black"
        pos="absolute"
        top={0}
        left={0}
        right={0}
        bottom={-CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING}
      >
        <BackgroundImage colors={['rgba(252, 205, 108, 0)', '#FCCD6C']} />
      </Stack>
      <BitcoinPriceChart />
    </Stack>
  )
}

function Header(): JSX.Element | null {
  return <BtcPriceHeader />
}

export default Header
