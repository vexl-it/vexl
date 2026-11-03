import {useFocusEffect} from '@react-navigation/native'
import {
  Button,
  NavigationBar,
  Screen,
  SearchableSelectList,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {type AppSettingsStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {setAppLanguageActionAtom} from '../../../utils/localization/setAppLanguageActionAtom'
import {appLanguageFromPreferencesAtom} from '../../../utils/preferences'
import {
  appSettingsLanguagesAtom,
  appSettingsLanguageSearchTextAtom,
  appSettingsLanguagesToDisplayAtom,
  getAppSettingsLanguageFlag,
  getAppSettingsLanguageLabel,
  type AppSettingsLanguage,
} from '../atoms'

const defaultLanguage: AppSettingsLanguage = 'en'

function toAppSettingsLanguage(
  language: string | undefined,
  availableLanguages: readonly AppSettingsLanguage[]
): AppSettingsLanguage {
  if (!language) return defaultLanguage
  return pipe(
    availableLanguages,
    Array.findFirst((supportedLanguage) => supportedLanguage === language),
    Option.getOrElse(() => defaultLanguage)
  )
}

function AppSettingsLanguageScreen({
  navigation,
}: AppSettingsStackScreenProps<'AppSettingsLanguage'>): React.ReactElement {
  const {t} = useTranslation()
  const appLanguagePreference = useAtomValue(appLanguageFromPreferencesAtom)
  const availableLanguages = useAtomValue(appSettingsLanguagesAtom)
  const languagesToDisplay = useAtomValue(appSettingsLanguagesToDisplayAtom)
  const setAppLanguage = useSetAtom(setAppLanguageActionAtom)
  const setSearchText = useSetAtom(appSettingsLanguageSearchTextAtom)
  const [tempSelection, setTempSelection] = useState<AppSettingsLanguage>(
    toAppSettingsLanguage(appLanguagePreference, availableLanguages)
  )

  const close = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const save = useCallback(() => {
    setAppLanguage({language: tempSelection, onDone: close})
  }, [close, setAppLanguage, tempSelection])

  useFocusEffect(
    useCallback(() => {
      setSearchText('')
      setTempSelection(
        toAppSettingsLanguage(appLanguagePreference, availableLanguages)
      )
    }, [availableLanguages, appLanguagePreference, setSearchText])
  )

  const getLabel = useCallback(
    (item: AppSettingsLanguage) =>
      `${getAppSettingsLanguageFlag(item)} ${getAppSettingsLanguageLabel(item, t)}`,
    [t]
  )

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('appSettings.changeLanguage')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: close,
            },
          ]}
        />
      }
      footer={<Button onPress={save}>{t('common.save')}</Button>}
    >
      <SearchableSelectList
        items={languagesToDisplay}
        keyExtractor={String}
        getLabel={getLabel}
        selectedKey={tempSelection}
        onSelect={setTempSelection}
        searchValueAtom={appSettingsLanguageSearchTextAtom}
        searchPlaceholder={t('common.search')}
        emptyTitle={t('common.nothingFound')}
      />
    </Screen>
  )
}

export default AppSettingsLanguageScreen
