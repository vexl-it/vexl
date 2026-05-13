import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {KeyboardAvoidingView} from '@vexl-next/ui'
import React from 'react'
import {type DonationsFlowParamsList} from '../../navigationTypes'
import DonationDetailsScreen from '../DonationDetailsScreen'
import MyDonationsScreen from './components/MyDonationsScreen'
import SetDonationScreen from './components/SetDonationScreen'

const Stack = createNativeStackNavigator<DonationsFlowParamsList>()

function DonationsFlow(): React.ReactElement {
  return (
    <KeyboardAvoidingView>
      <Stack.Navigator
        initialRouteName="MyDonations"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MyDonations" component={MyDonationsScreen} />
        <Stack.Screen name="SetDonation" component={SetDonationScreen} />
        <Stack.Screen
          name="DonationDetails"
          component={DonationDetailsScreen}
        />
      </Stack.Navigator>
    </KeyboardAvoidingView>
  )
}

export default DonationsFlow
