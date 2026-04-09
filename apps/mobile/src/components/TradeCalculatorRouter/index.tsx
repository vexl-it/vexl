import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import {type TradeCalculatorStackParamsList} from '../../navigationTypes'
import PageWithNavigationHeader from '../PageWithNavigationHeader'
import {resetTradeCalculatorStateActionAtom} from './atoms'
import PremiumOrDiscountScreen from './components/PremiumOrDiscountScreen'
import SetYourOwnPriceScreen from './components/SetYourOwnPriceScreen'
import TradeCalculatorScreen from './components/TradeCalculatorScreen'

const StackNavigator =
  createNativeStackNavigator<TradeCalculatorStackParamsList>()

export default function TradeCalculatorFlow(): React.ReactElement {
  const {bottom, top} = useSafeAreaInsets()

  const resetTradeCalculatorState = useSetAtom(
    resetTradeCalculatorStateActionAtom
  )

  useEffect(() => {
    void resetTradeCalculatorState()()
  }, [resetTradeCalculatorState])

  return (
    <KeyboardAvoidingView>
      <Stack pt={top} pb={bottom} f={1}>
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
      </Stack>
    </KeyboardAvoidingView>
  )
}
