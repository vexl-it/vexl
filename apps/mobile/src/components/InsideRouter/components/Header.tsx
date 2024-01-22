import {LinearGradient} from 'expo-linear-gradient'
import {useAtomValue} from 'jotai'
import {Stack, styled} from 'tamagui'
import marketplaceLayoutModeAtom from '../../../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import BitcoinPriceChart from './BitcoinPriceChart'
import {CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING} from './ContainerWithTopBorderRadius'

const CHART_HEADER_HEGIHT_PX = 100

const BackgroundImage = styled(LinearGradient, {
  w: '100%',
  h: '100%',
  o: 0.2,
  colors: ['rgba(252, 205, 108, 0)', '#FCCD6C'],
})

function BtcPriceHeader(): JSX.Element {
  return (
    <Stack h={CHART_HEADER_HEGIHT_PX}>
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

export default function Header(): JSX.Element | null {
  const marketplaceLayoutMode = useAtomValue(marketplaceLayoutModeAtom)

  if (marketplaceLayoutMode === 'map') {
    return null
  }
  return <BtcPriceHeader />
}
