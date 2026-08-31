import {useFocusEffect} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {
  type RootStackScreenProps,
  type TradeChecklistStackParamsList,
} from '../../navigationTypes'
import * as fromChatAtoms from '../../state/tradeChecklist/atoms/fromChatAtoms'
import {areThereUpdatesToBeSentAtom} from '../../state/tradeChecklist/atoms/updatesToBeSentAtom'
import usePreventDiscardChangesWithConfirmation from '../../utils/usePreventDiscardChangesWithConfirmation'
import {askAreYouSureAndClearUpdatesToBeSentActionAtom} from './atoms/updatesToBeSentAtom'
import AgreeOnTradeDetailsScreen from './components/AgreeOnTradeDetailsScreen'
import CalculateAmountScreen from './components/CalculateAmountFlow/components/CalculateAmountScreen'
import ConfirmAmountScreen from './components/CalculateAmountFlow/components/ConfirmAmountScreen'
import PremiumOrDiscountScreen from './components/CalculateAmountFlow/components/PremiumOrDiscountScreen'
import AddTimeOptionsScreen from './components/DateAndTimeFlow/components/AddTimeOptionsScreen'
import ChooseAvailableDaysScreen from './components/DateAndTimeFlow/components/ChooseAvailableDaysScreen'
import PickDateFromSuggestionsScreen from './components/DateAndTimeFlow/components/PickDateFromSuggestionsScreen'
import PickTimeFromSuggestions from './components/DateAndTimeFlow/components/PickTimeFromSuggestions'
import LocationMapPreview from './components/MeetingLocation/components/LocationMapPreview'
import LocationMapSelect from './components/MeetingLocation/components/LocationMapSelect'
import LocationSearch from './components/MeetingLocation/components/LocationSearch'
import NetworkScreen from './components/NetworkFlow/components/NetworkScreen'
import RevealIdentityNicknameScreen from './components/RevealIdentityFlow/RevealIdentityNicknameScreen'
import RevealIdentityPhotoScreen from './components/RevealIdentityFlow/RevealIdentityPhotoScreen'
import RevealIdentitySummaryScreen from './components/RevealIdentityFlow/RevealIdentitySummaryScreen'

const StackNavigator =
  createNativeStackNavigator<TradeChecklistStackParamsList>()

type Props = RootStackScreenProps<'TradeChecklistFlow'>

export default function TradeChecklistFlow({
  route: {
    params: {chatId, inboxKey},
  },
}: Props): React.ReactElement {
  const setParentChat = useSetAtom(fromChatAtoms.setParentChatActionAtom)
  const areThereUpdatesToBeSent = useAtomValue(areThereUpdatesToBeSentAtom)
  const askAreYouSureAndClearUpdatesToBeSent = useSetAtom(
    askAreYouSureAndClearUpdatesToBeSentActionAtom
  )

  const confirmLeave = useCallback(
    async () => await askAreYouSureAndClearUpdatesToBeSent()(),
    [askAreYouSureAndClearUpdatesToBeSent]
  )

  usePreventDiscardChangesWithConfirmation({
    enabled: areThereUpdatesToBeSent,
    confirmLeave,
  })

  useFocusEffect(
    useCallback(() => {
      setParentChat({chatId, inboxKey})
    }, [chatId, inboxKey, setParentChat])
  )

  return (
    <>
      <StackNavigator.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="AgreeOnTradeDetails"
      >
        <StackNavigator.Screen
          name="AgreeOnTradeDetails"
          component={AgreeOnTradeDetailsScreen}
        />
        <StackNavigator.Screen
          name="RevealIdentityPhoto"
          component={RevealIdentityPhotoScreen}
        />
        <StackNavigator.Screen
          name="RevealIdentityNickname"
          component={RevealIdentityNicknameScreen}
        />
        <StackNavigator.Screen
          name="RevealIdentitySummary"
          component={RevealIdentitySummaryScreen}
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
        <StackNavigator.Screen
          name="ConfirmAmount"
          component={ConfirmAmountScreen}
        />
        <StackNavigator.Screen
          name="PremiumOrDiscount"
          component={PremiumOrDiscountScreen}
        />
        <StackNavigator.Screen name="Network" component={NetworkScreen} />
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
    </>
  )
}
