import {useFocusEffect} from '@react-navigation/native'
import {FlashList} from '@shopify/flash-list'
import {type CurrencyInfo} from '@vexl-next/domain/src/general/currency.brand'
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
import {Array} from 'effect'
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
import {useKeyboardAwareFooterListPadding} from '../useKeyboardAwareFooterListPadding'

function CurrencyList({
  currenciesToDisplay,
  renderItem,
}: {
  readonly currenciesToDisplay: readonly CurrencyInfo[]
  readonly renderItem: (props: {
    readonly item: CurrencyInfo
  }) => React.ReactElement
}): React.ReactElement {
  const listPaddingBottom = useKeyboardAwareFooterListPadding()

  return (
    <FlashList
      data={currenciesToDisplay}
      renderItem={renderItem}
      keyExtractor={(item) => item.code}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: listPaddingBottom,
      }}
    />
  )
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

  const renderItem = useCallback(
    ({item}: {readonly item: CurrencyInfo}) => (
      <SelectableItem
        label={`${item.flag} ${t(`currency.${item.code}`)}`}
        note={`${item.code} / ${item.symbol}`}
        selected={item.code === tempSelection}
        onPress={() => {
          setTempSelection(item.code)
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
      <SearchBar
        valueAtom={appSettingsCurrencySearchTextAtom}
        placeholder={t('common.search')}
        marginBottom="$4"
      />
      {Array.isNonEmptyArray(currenciesToDisplay) ? (
        <CurrencyList
          currenciesToDisplay={currenciesToDisplay}
          renderItem={renderItem}
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
          <Typography
            variant="description"
            textAlign="center"
            color="$foregroundSecondary"
          >
            {t('changeCurrency.trySearchingByCurrencyName')}
          </Typography>
        </Stack>
      )}
    </Screen>
  )
}

export default AppSettingsCurrencyScreen
