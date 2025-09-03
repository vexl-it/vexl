import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {type PostLoginFlowStackParamsList} from '../../navigationTypes'
import PageWithButtonAndProgressHeader from '../PageWithButtonAndProgressHeader'
import FindOffersInVexlClubsScreen from './components/FindOffersInVexlClubsScreen'
import ImportContactsExplanationScreen from './components/ImportContactsExplanation'

const Stack = createNativeStackNavigator<PostLoginFlowStackParamsList>()

export default function PostLoginFlow(): React.ReactElement {
  return (
    <PageWithButtonAndProgressHeader>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'card',
        }}
      >
        <Stack.Screen
          name="ImportContactsExplanationScreen"
          component={ImportContactsExplanationScreen}
        />
        <Stack.Screen
          name="FindOffersInVexlClubsScreen"
          component={FindOffersInVexlClubsScreen}
        />
        {/* <Stack.Screen
          name="AllowNotificationsExplanation"
          component={AllowNotificationsExplanationScreen}
        /> */}
      </Stack.Navigator>
    </PageWithButtonAndProgressHeader>
  )
}
