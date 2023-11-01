import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {getTokens, YStack} from 'tamagui'
import {focusAtom} from 'jotai-optics'
import {notificationPreferencesAtom} from '../../utils/preferences'
import PreferenceItem from './components/PreferenceItem'
import {ScrollView} from 'react-native'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {useMemo} from 'react'

const notificationPreferencesToShow = [
  'marketing',
  'chat',
  'inactivityWarnings',
  // 'newPhoneContacts',
  'newOfferInMarketplace',
] as const

function NotificationSettingsScreen(): JSX.Element {
  const {t} = useTranslation()

  const contents = useMemo(() => {
    return notificationPreferencesToShow.map((one) => ({
      title: t(`notifications.preferences.${one}.title`),
      description: t(`notifications.preferences.${one}.body`),
      atom: focusAtom(notificationPreferencesAtom, (o) => o.prop(one)),
    }))
  }, [t])

  return (
    <Screen customHorizontalPadding={getTokens().space[2].val}>
      <ScreenTitle
        text={t('notifications.preferences.screenTitle')}
        showCloseButton
      />
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
