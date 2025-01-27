import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {type JoinClubFlowParamsList} from '../../navigationTypes'
import ScanClubQrCodeScreen from './components/ScanClubQrCodeScreen'

const JoinClubFlowStack = createNativeStackNavigator<JoinClubFlowParamsList>()

function JoinClubFlow(): JSX.Element {
  return (
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
    </JoinClubFlowStack.Navigator>
  )
}

export default JoinClubFlow
