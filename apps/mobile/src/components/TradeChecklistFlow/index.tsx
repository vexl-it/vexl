import React, {useEffect} from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {
  type RootStackScreenProps,
  type TradeChecklistStackParamsList,
} from '../../navigationTypes'
import AgreeOnTradeDetailsScreen from './components/AgreeOnTradeDetailsScreen'
import ChooseAvailableDaysScreen from './components/DateAndTimeFlow/components/ChooseAvailableDaysScreen'
import AddTimeOptionsScreen from './components/DateAndTimeFlow/components/AddTimeOptionsScreen'
import {useSetAtom} from 'jotai'
import Animated, {FadeIn} from 'react-native-reanimated'
import {Stack} from 'tamagui'
import {StyleSheet} from 'react-native'
import PageWithNavigationHeader from '../PageWithNavigationHeader'
import SetYourOwnPriceScreen from './components/CalculateAmountFlow/components/SetYourOwnPriceScreen'
import CalculateAmountScreen from './components/CalculateAmountFlow/components/CalculateAmountScreen'
import PremiumOrDiscountScreen from './components/CalculateAmountFlow/components/PremiumOrDiscountScreen'
import TradePriceTypeDialog from './components/CalculateAmountFlow/components/TradePriceTypeDialog'
import NetworkScreen from './components/NetworkFlow/components/NetworkScreen'
import BtcAddressScreen from './components/NetworkFlow/components/BtcAddressScreen'
import * as fromChatAtoms from './atoms/fromChatAtoms'
import PickDateFromSuggestionsScreen from './components/DateAndTimeFlow/components/PickDateFromSuggestionsScreen'
import PickTimeFromSuggestions from './components/DateAndTimeFlow/components/PickTimeFromSuggestions'

const StackNavigator =
  createNativeStackNavigator<TradeChecklistStackParamsList>()

type Props = RootStackScreenProps<'TradeChecklistFlow'>

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

export default function TradeChecklistFlow({
  route: {
    params: {chatId, inboxKey},
  },
}: Props): JSX.Element {
  const setParentChat = useSetAtom(fromChatAtoms.setParentChatActionAtom)

  useEffect(() => {
    setParentChat({chatId, inboxKey})
  }, [chatId, setParentChat, inboxKey])

  return (
    <>
      <Animated.View entering={FadeIn.delay(200)} style={styles.backdrop} />
      <Stack h={100} />
      <Stack
        width={36}
        h={5}
        als={'center'}
        bc={'$greyAccent1'}
        br={'$5'}
        mt={'$4'}
      />
      <PageWithNavigationHeader>
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
          <StackNavigator.Screen
            name={'PickDateFromSuggestions'}
            component={PickDateFromSuggestionsScreen}
          />
          <StackNavigator.Screen
            name={'PickTimeFromSuggestions'}
            component={PickTimeFromSuggestions}
          />

          <StackNavigator.Screen
            name={'CalculateAmount'}
            component={CalculateAmountScreen}
          />
          <StackNavigator.Screen
            name={'SetYourOwnPrice'}
            component={SetYourOwnPriceScreen}
          />
          <StackNavigator.Screen
            name={'PremiumOrDiscount'}
            component={PremiumOrDiscountScreen}
          />
          <StackNavigator.Screen name={'Network'} component={NetworkScreen} />
          <StackNavigator.Screen
            name={'BtcAddress'}
            component={BtcAddressScreen}
          />
        </StackNavigator.Navigator>
      </PageWithNavigationHeader>
      <TradePriceTypeDialog />
    </>
  )
}
