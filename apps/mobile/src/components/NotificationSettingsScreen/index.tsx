import {focusAtom} from 'jotai-optics'
import React, {useMemo} from 'react'
import {ScrollView} from 'react-native'
import {getTokens, YStack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {notificationPreferencesAtom} from '../../utils/preferences'
import useSafeGoBack from '../../utils/useSafeGoBack'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import PreferenceItem from './components/PreferenceItem'

const notificationPreferencesToShow = [
  'marketing',
  'chat',
  'inactivityWarnings',
  // 'newPhoneContacts',
  'newOfferInMarketplace',
] as const

function NotificationSettingsScreen(): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  const contents = useMemo(() => {
    return notificationPreferencesToShow.map((one) => ({
      title: t(`notifications.preferences.${one}.title`),
      description: t(`notifications.preferences.${one}.body`),
      atom: focusAtom(notificationPreferencesAtom, (o) => o.prop(one)),
    }))
  }, [t])

  return (
    <Screen customHorizontalPadding={getTokens().space[2].val}>
      <ScreenTitle text={t('notifications.preferences.screenTitle')}>
        <IconButton variant="dark" icon={closeSvg} onPress={safeGoBack} />
      </ScreenTitle>
      <ScrollView>
        <YStack space={6}>
          {contents.map((one) => (
            <PreferenceItem key={one.atom.toString()} {...one} />
          ))}
        </YStack>
      </ScrollView>
    </Screen>
  )
}

export default NotificationSettingsScreen
