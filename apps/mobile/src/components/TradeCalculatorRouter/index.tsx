import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {KeyboardAvoidingView} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {type TradeCalculatorStackParamsList} from '../../navigationTypes'
import {resetTradeCalculatorStateActionAtom} from './atoms'
import PremiumOrDiscountScreen from './components/PremiumOrDiscountScreen'
import TradeCalculatorScreen from './components/TradeCalculatorScreen'

const StackNavigator =
  createNativeStackNavigator<TradeCalculatorStackParamsList>()

export default function TradeCalculatorFlow(): React.ReactElement {
  const resetTradeCalculatorState = useSetAtom(
    resetTradeCalculatorStateActionAtom
  )

  useEffect(() => {
    void resetTradeCalculatorState()()
  }, [resetTradeCalculatorState])

  return (
    <KeyboardAvoidingView>
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
      </StackNavigator.Navigator>
    </KeyboardAvoidingView>
  )
}
