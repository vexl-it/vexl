import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {Array, Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useState} from 'react'
import {
  type PostLoginFlowStackParamsList,
  type PostLoginFlowStackScreenProps,
} from '../../navigationTypes'
import {checkAreNotificationsEnabledAtom} from '../../state/notifications/areNotificationsEnabledAtom'
import {
  postLoginFlowCompletedScreensAtom,
  postLoginFlowEffectiveCompletedScreensAtom,
} from '../../state/postLoginOnboarding'
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
  const completedScreens = useAtomValue(
    postLoginFlowEffectiveCompletedScreensAtom
  )
  const storedCompletedScreens = useAtomValue(postLoginFlowCompletedScreensAtom)
  const checkAreNotificationsEnabled = useSetAtom(
    checkAreNotificationsEnabledAtom
  )
  // Only check when resuming past contacts import. Starting a check during an
  // active import would unmount the navigator before its goNext callback runs.
  // Use stored notification completion so cached permission state is rechecked.
  const [isCheckingNotifications, setIsCheckingNotifications] = useState(
    () =>
      Array.contains(completedScreens, 'contactsImport') &&
      !Array.contains(storedCompletedScreens, 'notificationSetup')
  )

  useEffect(() => {
    if (!isCheckingNotifications) return

    let shouldUpdateState = true

    void Effect.runPromise(checkAreNotificationsEnabled()).finally(() => {
      if (!shouldUpdateState) return

      setIsCheckingNotifications(false)
    })

    return () => {
      shouldUpdateState = false
    }
  }, [checkAreNotificationsEnabled, isCheckingNotifications])

  if (isCheckingNotifications) {
    return <></>
  }

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
