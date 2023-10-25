import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {type TradeChecklistStackParamsList} from '../../navigationTypes'
import AgreeOnTradeDetailsScreen from './components/AgreeOnTradeDetailsScreen'

const StackNavigator =
  createNativeStackNavigator<TradeChecklistStackParamsList>()

export default function TradeChecklist(): JSX.Element {
  return (
    <>
      <StackNavigator.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={'AgreeOnTradeDetails'}
      >
        <StackNavigator.Screen
          name={'AgreeOnTradeDetails'}
          component={AgreeOnTradeDetailsScreen}
          options={{presentation: 'modal'}}
        />
      </StackNavigator.Navigator>
    </>
  )
}
