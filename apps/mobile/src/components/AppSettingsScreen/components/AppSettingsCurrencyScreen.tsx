import {useFocusEffect} from '@react-navigation/native'
import {type CurrencyInfo} from '@vexl-next/domain/src/general/currency.brand'
import {
  Button,
  NavigationBar,
  Screen,
  SearchableSelectList,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {type AppSettingsStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {defaultCurrencyAtom} from '../../../utils/preferences'
import {
  appSettingsCurrenciesToDisplayAtom,
  appSettingsCurrencySearchTextAtom,
  type AppSettingsCurrencyCode,
} from '../atoms'

function currencyCode(item: CurrencyInfo): string {
  return item.code
}

function currencyNote(item: CurrencyInfo): string {
  return `${item.code} / ${item.symbol}`
}

function AppSettingsCurrencyScreen({
  navigation,
}: AppSettingsStackScreenProps<'AppSettingsCurrency'>): React.ReactElement {
  const {t} = useTranslation()
  const defaultCurrency = useAtomValue(defaultCurrencyAtom)
  const currenciesToDisplay = useAtomValue(appSettingsCurrenciesToDisplayAtom)
  const setDefaultCurrency = useSetAtom(defaultCurrencyAtom)
  const setSearchText = useSetAtom(appSettingsCurrencySearchTextAtom)
  const [tempSelection, setTempSelection] =
    useState<AppSettingsCurrencyCode>(defaultCurrency)

  const close = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const save = useCallback(() => {
    setDefaultCurrency(tempSelection)
    close()
  }, [close, setDefaultCurrency, tempSelection])

  useFocusEffect(
    useCallback(() => {
      setSearchText('')
      setTempSelection(defaultCurrency)
    }, [defaultCurrency, setSearchText])
  )

  const getLabel = useCallback(
    (item: CurrencyInfo) => `${item.flag} ${t(`currency.${item.code}`)}`,
    [t]
  )

  const selectCurrency = useCallback((item: CurrencyInfo) => {
    setTempSelection(item.code)
  }, [])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('appSettings.changeCurrency')}
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
        items={currenciesToDisplay}
        keyExtractor={currencyCode}
        getLabel={getLabel}
        getNote={currencyNote}
        selectedKey={tempSelection}
        onSelect={selectCurrency}
        searchValueAtom={appSettingsCurrencySearchTextAtom}
        searchPlaceholder={t('common.search')}
        emptyTitle={t('common.nothingFound')}
        emptyDescription={t('changeCurrency.trySearchingByCurrencyName')}
      />
    </Screen>
  )
}

export default AppSettingsCurrencyScreen
