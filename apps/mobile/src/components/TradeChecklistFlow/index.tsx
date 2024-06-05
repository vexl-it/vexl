import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {
  type RootStackScreenProps,
  type TradeChecklistStackParamsList,
} from '../../navigationTypes'
import * as fromChatAtoms from '../../state/tradeChecklist/atoms/fromChatAtoms'
import TradePriceTypeDialog from '../TradeCalculator/components/TradePriceTypeDialog'
import AgreeOnTradeDetailsScreen from './components/AgreeOnTradeDetailsScreen'
import CalculateAmountScreen from './components/CalculateAmountFlow/components/CalculateAmountScreen'
import AddTimeOptionsScreen from './components/DateAndTimeFlow/components/AddTimeOptionsScreen'
import ChooseAvailableDaysScreen from './components/DateAndTimeFlow/components/ChooseAvailableDaysScreen'
import PickDateFromSuggestionsScreen from './components/DateAndTimeFlow/components/PickDateFromSuggestionsScreen'
import PickTimeFromSuggestions from './components/DateAndTimeFlow/components/PickTimeFromSuggestions'
import LocationMapPreview from './components/MeetingLocation/components/LocationMapPreview'
import LocationMapSelect from './components/MeetingLocation/components/LocationMapSelect'
import LocationSearch from './components/MeetingLocation/components/LocationSearch'
import BtcAddressScreen from './components/NetworkFlow/components/BtcAddressScreen'
import NetworkScreen from './components/NetworkFlow/components/NetworkScreen'
import TradeChecklistFlowPageContainer from './components/TradeChecklistFlowPageContainer'

const StackNavigator =
  createNativeStackNavigator<TradeChecklistStackParamsList>()

type Props = RootStackScreenProps<'TradeChecklistFlow'>

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
      <TradeChecklistFlowPageContainer>
        <StackNavigator.Navigator
          screenOptions={{headerShown: false}}
          initialRouteName="AgreeOnTradeDetails"
        >
          <StackNavigator.Screen
            name="AgreeOnTradeDetails"
            component={AgreeOnTradeDetailsScreen}
          />
          <StackNavigator.Screen
            name="ChooseAvailableDays"
            component={ChooseAvailableDaysScreen}
          />
          <StackNavigator.Screen
            name="AddTimeOptions"
            component={AddTimeOptionsScreen}
          />
          <StackNavigator.Screen
            name="PickDateFromSuggestions"
            component={PickDateFromSuggestionsScreen}
          />
          <StackNavigator.Screen
            name="PickTimeFromSuggestions"
            component={PickTimeFromSuggestions}
          />

          <StackNavigator.Screen
            name="CalculateAmount"
            component={CalculateAmountScreen}
          />
          <StackNavigator.Screen name="Network" component={NetworkScreen} />
          <StackNavigator.Screen
            name="BtcAddress"
            component={BtcAddressScreen}
          />
          <StackNavigator.Screen
            name="LocationSearch"
            component={LocationSearch}
          />
          <StackNavigator.Screen
            name="LocationMapPreview"
            component={LocationMapPreview}
          />
          <StackNavigator.Screen
            name="LocationMapSelect"
            component={LocationMapSelect}
          />
        </StackNavigator.Navigator>
      </TradeChecklistFlowPageContainer>
      <TradePriceTypeDialog />
    </>
  )
}
