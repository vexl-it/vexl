import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'

export const CHART_HEIGHT_PX = 100

function BitcoinPriceChart(): JSX.Element {
  const insets = useSafeAreaInsets()

  return (
    <Stack h={CHART_HEIGHT_PX}>
      <Stack f={1} pt={insets.top} />
    </Stack>
  )
}

export default BitcoinPriceChart

// linear-gradient(180deg, #FCCD6C 0%, rgba(252, 205, 108, 0) 100%);
