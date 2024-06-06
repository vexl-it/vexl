import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useSetAtom} from 'jotai'
import {useEffect} from 'react'
import Animated, {FadeIn} from 'react-native-reanimated'
import {Stack} from 'tamagui'
import {type TradeCalculatorStackParamsList} from '../../navigationTypes'
import {backdropStyles} from '../../utils/backdropStyles'
import GoBackOnSwipeDown from '../GoBackOnSwipeDown'
import PageWithNavigationHeader from '../PageWithNavigationHeader'
import TradePriceTypeDialog from '../TradeCalculator/components/TradePriceTypeDialog'
import {resetTradeCalculatorStateActionAtom} from './atoms'
import PremiumOrDiscountScreen from './components/PremiumOrDiscountScreen'
import SetYourOwnPriceScreen from './components/SetYourOwnPriceScreen'
import TradeCalculatorScreen from './components/TradeCalculatorScreen'

const StackNavigator =
  createNativeStackNavigator<TradeCalculatorStackParamsList>()

export default function TradeCalculatorFlow(): JSX.Element {
  const resetTradeCalculatorState = useSetAtom(
    resetTradeCalculatorStateActionAtom
  )

  useEffect(() => {
    void resetTradeCalculatorState()()
  }, [resetTradeCalculatorState])

  return (
    <>
      <>
        <Animated.View
          entering={FadeIn.delay(200)}
          style={backdropStyles.backdrop}
        />
        <Stack h={100} />
        <GoBackOnSwipeDown>
          <Stack bc="$black" pt="$2">
            <Stack width={36} h={5} als="center" bc="$greyAccent1" br="$5" />
          </Stack>
        </GoBackOnSwipeDown>
      </>
      <PageWithNavigationHeader>
        <StackNavigator.Navigator
          screenOptions={{headerShown: false}}
          initialRouteName="TradeCalculator"
        >
          <StackNavigator.Screen
            name="TradeCalculator"
            component={TradeCalculatorScreen}
          />
          <StackNavigator.Screen
            name="PremiumOrDiscount"
            component={PremiumOrDiscountScreen}
          />
          <StackNavigator.Screen
            name="SetYourOwnPrice"
            component={SetYourOwnPriceScreen}
          />
        </StackNavigator.Navigator>
      </PageWithNavigationHeader>
      <TradePriceTypeDialog />
    </>
  )
}
