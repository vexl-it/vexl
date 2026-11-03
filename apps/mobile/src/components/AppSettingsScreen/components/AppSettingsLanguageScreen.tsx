import {useFocusEffect} from '@react-navigation/native'
import {FlashList} from '@shopify/flash-list'
import {
  Button,
  EmptyState,
  NavigationBar,
  Screen,
  SearchBar,
  SelectableItem,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {type AppSettingsStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {setAppLanguageActionAtom} from '../../../utils/localization/setAppLanguageActionAtom'
import {appLanguageFromPreferencesAtom} from '../../../utils/preferences'
import {useKeyboardAwareFooterListPadding} from '../../../utils/useKeyboardAwareFooterListPadding'
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

function LanguageList({
  languagesToDisplay,
  renderItem,
}: {
  readonly languagesToDisplay: readonly AppSettingsLanguage[]
  readonly renderItem: (props: {
    readonly item: AppSettingsLanguage
  }) => React.ReactElement
}): React.ReactElement {
  const listPaddingBottom = useKeyboardAwareFooterListPadding()

  return (
    <FlashList
      data={languagesToDisplay}
      renderItem={renderItem}
      keyExtractor={(item) => item}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: listPaddingBottom,
      }}
    />
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

  const renderItem = useCallback(
    ({item}: {readonly item: AppSettingsLanguage}) => (
      <SelectableItem
        label={`${getAppSettingsLanguageFlag(
          item
        )} ${getAppSettingsLanguageLabel(item, t)}`}
        selected={item === tempSelection}
        onPress={() => {
          setTempSelection(item)
        }}
      />
    ),
    [t, tempSelection]
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
      <SearchBar
        valueAtom={appSettingsLanguageSearchTextAtom}
        placeholder={t('common.search')}
        marginBottom="$4"
      />
      {Array.isNonEmptyArray(languagesToDisplay) ? (
        <LanguageList
          languagesToDisplay={languagesToDisplay}
          renderItem={renderItem}
        />
      ) : (
        <EmptyState title={t('common.nothingFound')} />
      )}
    </Screen>
  )
}

export default AppSettingsLanguageScreen
