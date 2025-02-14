import {useNavigation} from '@react-navigation/native'
import {LinearGradient} from 'expo-linear-gradient'
import {TouchableOpacity} from 'react-native'
import {getFontScaleSync} from 'react-native-device-info'
import {Stack, XStack, getTokens, styled} from 'tamagui'
import Image from '../../Image'
import eventsAndClubsYellowIconSvg from '../../images/EventsAndClubsYellowIcon'
import BitcoinPriceChart from './BitcoinPriceChart'
import {CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING} from './ContainerWithTopBorderRadius'
import calculatorSvg from './MarketplaceScreen/images/calculatorSvg'

const CHART_HEADER_HEIGHT_PX = 95

const BackgroundImage = styled(LinearGradient, {
  w: '100%',
  h: '100%',
  o: 0.2,
  colors: ['rgba(252, 205, 108, 0)', '#FCCD6C'],
})

function BtcPriceHeader(): JSX.Element {
  const navigation = useNavigation()
  const fontScale = getFontScaleSync()

  return (
    <Stack h={CHART_HEADER_HEIGHT_PX * fontScale}>
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
      <XStack f={1} ai="flex-end" jc="space-between">
        <XStack gap="$0" alignItems="center" mb="$1" ml="$3">
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('TradeCalculatorFlow', {
                screen: 'TradeCalculator',
              })
            }}
          >
            <XStack ai="center" gap="$1" br="$2" py="$1" px="$1">
              <Image
                source={calculatorSvg}
                stroke={getTokens().color.main.val}
              />
            </XStack>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('EventsAndClubs', {
                screen: 'Events',
              })
            }}
          >
            <XStack ai="center" gap="$1" br="$2" py="$1" px="$1">
              <Image
                source={eventsAndClubsYellowIconSvg}
                stroke={getTokens().color.main.val}
              />
            </XStack>
          </TouchableOpacity>
        </XStack>
        <BitcoinPriceChart />
      </XStack>
    </Stack>
  )
}

function Header(): JSX.Element | null {
  return <BtcPriceHeader />
}

export default Header
