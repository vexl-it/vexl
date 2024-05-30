import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {type PostLoginStackParamsList} from '../../navigationTypes'
import PageWithButtonAndProgressHeader from '../PageWithButtonAndProgressHeader'
import ImportContactsExplanation from './components/ImportContactsExplanation'

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
        {/* <Stack.Screen
          name="AllowNotificationsExplanation"
          component={AllowNotificationsExplanationScreen}
        /> */}
      </Stack.Navigator>
    </PageWithButtonAndProgressHeader>
  )
}
