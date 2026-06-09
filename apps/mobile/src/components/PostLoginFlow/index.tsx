import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {Array, Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useState} from 'react'
import {
  type PostLoginFlowStackParamsList,
  type PostLoginFlowStackScreenProps,
} from '../../navigationTypes'
import {importedContactsCountAtom} from '../../state/contacts/atom/contactsStore'
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
  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  const checkAreNotificationsEnabled = useSetAtom(
    checkAreNotificationsEnabledAtom
  )
  const [hasCheckedNotifications, setHasCheckedNotifications] = useState(false)
  const [isCheckingNotifications, setIsCheckingNotifications] = useState(false)
  const contactsImportCompleted =
    importedContactsCount > 0 ||
    Array.contains(storedCompletedScreens, 'contactsImport')
  const notificationSetupCompleted = Array.contains(
    storedCompletedScreens,
    'notificationSetup'
  )
  const shouldCheckNotifications =
    contactsImportCompleted &&
    !notificationSetupCompleted &&
    !hasCheckedNotifications

  useEffect(() => {
    if (!shouldCheckNotifications) return

    let shouldUpdateState = true

    setIsCheckingNotifications(true)
    void Effect.runPromise(checkAreNotificationsEnabled()).finally(() => {
      if (!shouldUpdateState) return

      setHasCheckedNotifications(true)
      setIsCheckingNotifications(false)
    })

    return () => {
      shouldUpdateState = false
    }
  }, [checkAreNotificationsEnabled, shouldCheckNotifications])

  if (shouldCheckNotifications || isCheckingNotifications) {
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
