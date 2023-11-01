import React, {useEffect} from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {
  type RootStackScreenProps,
  type TradeChecklistStackParamsList,
} from '../../navigationTypes'
import AgreeOnTradeDetailsScreen from './components/AgreeOnTradeDetailsScreen'
import {Stack} from 'tamagui'
import ChooseAvailableDaysScreen from './components/DateAndTimeFlow/components/ChooseAvailableDaysScreen'
import AddTimeOptionsScreen from './components/DateAndTimeFlow/components/AddTimeOptionsScreen'
import {StyleSheet} from 'react-native'
import Animated, {FadeIn} from 'react-native-reanimated'
import {useSetAtom} from 'jotai'
import {syncTradeCheckListStateWithChatActionAtom} from './atoms'

const StackNavigator =
  createNativeStackNavigator<TradeChecklistStackParamsList>()

const styles = StyleSheet.create({
  backdrop: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
})

type Props = RootStackScreenProps<'TradeChecklistFlow'>

export default function TradeChecklistFlow({
  route: {
    params: {chatId, inboxKey},
  },
}: Props): JSX.Element {
  const syncTradeCheckListStateWithChat = useSetAtom(
    syncTradeCheckListStateWithChatActionAtom
  )

  useEffect(() => {
    syncTradeCheckListStateWithChat({chatId, inboxKey})
  }, [chatId, syncTradeCheckListStateWithChat, inboxKey])

  return (
    <>
      <Animated.View entering={FadeIn.delay(200)} style={styles.backdrop} />
      <Stack h={100} />
      <StackNavigator.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={'AgreeOnTradeDetails'}
      >
        <StackNavigator.Screen
          name={'AgreeOnTradeDetails'}
          component={AgreeOnTradeDetailsScreen}
        />
        <StackNavigator.Screen
          name={'ChooseAvailableDays'}
          component={ChooseAvailableDaysScreen}
        />
        <StackNavigator.Screen
          name={'AddTimeOptions'}
          component={AddTimeOptionsScreen}
        />
      </StackNavigator.Navigator>
    </>
  )
}
