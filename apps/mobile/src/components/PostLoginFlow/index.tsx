import {type PostLoginStackParamsList} from '../../navigationTypes'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import ImportContactsExplanation from './components/ImportContactsExplanation'
import PageWithButtonAndProgressHeader from '../PageWithButtonAndProgressHeader'
import AllowNotificationsExplanationScreen from './components/AllowNotificationsExplanationScreen'

const Stack = createNativeStackNavigator<PostLoginStackParamsList>()

export default function PostLoginFlow(): JSX.Element {
  return (
    <PageWithButtonAndProgressHeader>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'card',
        }}
      >
        <Stack.Screen
          name="ImportContactsExplanation"
          component={ImportContactsExplanation}
        />
        <Stack.Screen
          name="AllowNotificationsExplanation"
          component={AllowNotificationsExplanationScreen}
        />
      </Stack.Navigator>
    </PageWithButtonAndProgressHeader>
  )
}
