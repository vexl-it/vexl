import {useFocusEffect} from '@react-navigation/native'
import {FlashList} from '@shopify/flash-list'
import {
  Button,
  NavigationBar,
  Screen,
  SearchBar,
  SelectableItem,
  Stack,
  Typography,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {getTokens} from 'tamagui'
import {type AppSettingsStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {currentAppLanguageAtom} from '../../../utils/preferences'
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
  const currentAppLanguage = useAtomValue(currentAppLanguageAtom)
  const availableLanguages = useAtomValue(appSettingsLanguagesAtom)
  const languagesToDisplay = useAtomValue(appSettingsLanguagesToDisplayAtom)
  const setCurrentAppLanguage = useSetAtom(currentAppLanguageAtom)
  const setSearchText = useSetAtom(appSettingsLanguageSearchTextAtom)
  const [tempSelection, setTempSelection] = useState<AppSettingsLanguage>(
    toAppSettingsLanguage(currentAppLanguage, availableLanguages)
  )

  const close = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const save = useCallback(() => {
    setCurrentAppLanguage(tempSelection)
    close()
  }, [close, setCurrentAppLanguage, tempSelection])

  useFocusEffect(
    useCallback(() => {
      setSearchText('')
      setTempSelection(
        toAppSettingsLanguage(currentAppLanguage, availableLanguages)
      )
    }, [availableLanguages, currentAppLanguage, setSearchText])
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
        <FlashList
          data={languagesToDisplay}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getTokens().space.$13.val,
          }}
        />
      ) : (
        <Stack alignItems="center" gap="$4" padding="$6">
          <Typography
            variant="heading3"
            textAlign="center"
            color="$foregroundPrimary"
          >
            {t('common.nothingFound')}
          </Typography>
        </Stack>
      )}
    </Screen>
  )
}

export default AppSettingsLanguageScreen
