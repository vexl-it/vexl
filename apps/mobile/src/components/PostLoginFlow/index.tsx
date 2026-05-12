import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {Array} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {
  type PostLoginFlowStackParamsList,
  type PostLoginFlowStackScreenProps,
} from '../../navigationTypes'
import {postLoginFlowCompletedScreensAtom} from '../../state/postLoginOnboarding'
import ContactsImportScreen from './components/ContactsImportScreen'
import NotificationSetupScreen from './components/NotificationSetupScreen'
import UsageInfoScreen from './components/UsageInfoScreen'

const Stack = createNativeStackNavigator<PostLoginFlowStackParamsList>()

function getInitialRouteName(
  completedScreens: readonly string[]
): keyof PostLoginFlowStackParamsList {
  if (!Array.contains(completedScreens, 'contactsImport')) {
    return 'ContactsImport'
  }

  if (!Array.contains(completedScreens, 'notificationSetup')) {
    return 'NotificationSetup'
  }

  return 'UsageInfo'
}

export default function PostLoginFlow(): React.ReactElement {
  const completedScreens = useAtomValue(postLoginFlowCompletedScreensAtom)

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName(completedScreens)}
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      <Stack.Screen name="ContactsImport" component={ContactsImportScreen} />
      <Stack.Screen
        name="NotificationSetup"
        component={NotificationSetupScreen}
      />
      <Stack.Screen name="UsageInfo" component={UsageInfoScreen} />
    </Stack.Navigator>
  )
}

export type PostLoginFlowScreenProps<
  T extends keyof PostLoginFlowStackParamsList,
> = PostLoginFlowStackScreenProps<T>
