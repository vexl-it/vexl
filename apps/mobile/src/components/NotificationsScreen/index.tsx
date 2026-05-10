import {useFocusEffect} from '@react-navigation/native'
import {ChevronLeft, NavigationBar, Screen} from '@vexl-next/ui'
import {Effect} from 'effect/index'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {useOnFocusAndAppState} from '../../utils/useFocusAndAppState'
import useSafeGoBack from '../../utils/useSafeGoBack'
import NotificationsList from './components/NotificationsList'
import {markAllAsSeenActionAtom} from './state'
import {fetchVexlProductNotificationsActionAtom} from './state/vexlProductNotifications'

function NotificationsScreen(): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()

  const fetchProductNotifications = useSetAtom(
    fetchVexlProductNotificationsActionAtom
  )
  const markAllAsSeen = useSetAtom(markAllAsSeenActionAtom)

  useOnFocusAndAppState(
    useCallback(() => {
      Effect.runFork(fetchProductNotifications())
    }, [fetchProductNotifications])
  )

  useFocusEffect(
    useCallback(() => {
      return () => {
        markAllAsSeen()
      }
    }, [markAllAsSeen])
  )

  return (
    <Screen
      noHorizontalPadding
      navigationBar={
        <NavigationBar
          style="back"
          title={t('notificationsScreen.title')}
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        />
      }
    >
      <NotificationsList />
    </Screen>
  )
}

export default NotificationsScreen
