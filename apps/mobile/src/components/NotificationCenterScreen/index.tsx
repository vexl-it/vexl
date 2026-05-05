import {ChevronLeft, NavigationBar, Screen} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'

function NotificationCenterScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('notifications.center.screenTitle')}
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        />
      }
    >
      {null}
    </Screen>
  )
}

export default NotificationCenterScreen
