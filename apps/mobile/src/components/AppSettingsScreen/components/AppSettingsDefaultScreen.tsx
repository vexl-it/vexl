import {
  ChevronLeft,
  DuoToneContrastTheme,
  EuroCurrency,
  Language,
  MenuItem,
  NavigationBar,
  Screen,
  ScreenCaptureShot,
  Switch,
  TelescopeExplore,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type AppSettingsStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {
  nearbyOffersEnabledAtom,
  nearbyOffersReceivingEnabledAtom,
} from '../../../utils/preferences'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {allowScreenshotsAtom} from '../atoms'

function AppSettingsDefaultScreen({
  navigation,
}: AppSettingsStackScreenProps<'AppSettingsDefault'>): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const nearbyOffersEnabled = useAtomValue(nearbyOffersEnabledAtom)

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('appSettings.title')}
          leftAction={{
            icon: ChevronLeft,
            onPress: goBack,
          }}
        />
      }
    >
      <YStack gap="$5">
        <MenuItem
          label={t('appSettings.changeLanguage')}
          icon={Language}
          onPress={() => {
            navigation.navigate('AppSettingsLanguage')
          }}
        />
        <MenuItem
          label={t('appSettings.changeCurrency')}
          icon={EuroCurrency}
          onPress={() => {
            navigation.navigate('AppSettingsCurrency')
          }}
        />
        <MenuItem
          label={t('appSettings.appearanceTitle')}
          icon={DuoToneContrastTheme}
          onPress={() => {
            navigation.navigate('AppSettingsAppearance')
          }}
        />
        <MenuItem
          label={t('appSettings.allowScreencapture')}
          icon={ScreenCaptureShot}
          showChevron={false}
          tag={<Switch valueAtom={allowScreenshotsAtom} />}
        />
        {nearbyOffersEnabled ? (
          <MenuItem
            label={t('appSettings.receiveNearbyOffers')}
            note={t('appSettings.receiveNearbyOffersNote')}
            icon={TelescopeExplore}
            showChevron={false}
            tag={<Switch valueAtom={nearbyOffersReceivingEnabledAtom} />}
          />
        ) : null}
      </YStack>
    </Screen>
  )
}

export default AppSettingsDefaultScreen
