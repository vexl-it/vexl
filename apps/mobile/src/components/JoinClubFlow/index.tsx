import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {ScopeProvider} from 'bunshi/dist/react'
import {atom} from 'jotai'
import React from 'react'
import {type JoinClubFlowParamsList} from '../../navigationTypes'
import {accessCodeDefaultValue, AccessCodeScope} from './atoms'
import FillClubAccessCodeScreen from './components/FillClubAccessCodeScreen'
import ScanClubQrCodeScreen from './components/ScanClubQrCodeScreen'

const JoinClubFlowStack = createNativeStackNavigator<JoinClubFlowParamsList>()

function JoinClubFlow(): React.ReactElement {
  return (
    <ScopeProvider scope={AccessCodeScope} value={atom(accessCodeDefaultValue)}>
      <JoinClubFlowStack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'card',
        }}
        initialRouteName="ScanClubQrCodeScreen"
      >
        <JoinClubFlowStack.Screen
          name="ScanClubQrCodeScreen"
          component={ScanClubQrCodeScreen}
        />
        <JoinClubFlowStack.Screen
          name="FillClubAccessCodeScreen"
          component={FillClubAccessCodeScreen}
        />
      </JoinClubFlowStack.Navigator>
    </ScopeProvider>
  )
}

export default JoinClubFlow
