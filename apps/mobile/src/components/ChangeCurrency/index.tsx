import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {FlashList} from '@shopify/flash-list'
import {
  type CurrencyCode,
  type CurrencyInfo,
} from '@vexl-next/domain/src/general/currency.brand'
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
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {getTokens} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {
  changeCurrenciesToDisplayAtom,
  type ChangeCurrencyConfig,
  changeCurrencyConfigAtom,
  changeCurrencySearchTextAtom,
} from './atoms'

const CurrencyItem = React.memo(function CurrencyItem({
  item,
  selected,
  onSelect,
}: {
  readonly item: CurrencyInfo
  readonly selected: boolean
  readonly onSelect: (code: CurrencyCode) => void
}): React.JSX.Element {
  const {t} = useTranslation()

  const handlePress = useCallback(() => {
    onSelect(item.code)
  }, [item.code, onSelect])

  return (
    <SelectableItem
      label={`${item.flag} ${t(`currency.${item.code}`)}`}
      note={`${item.code} / ${item.symbol}`}
      selected={selected}
      onPress={handlePress}
    />
  )
})

function ChangeCurrencyContent({
  selectedCurrencyCode,
  onSave,
  onClose,
}: {
  readonly selectedCurrencyCode: CurrencyCode | undefined
  readonly onSave: (currency: CurrencyCode) => void
  readonly onClose: () => void
}): React.JSX.Element {
  const {t} = useTranslation()
  const currenciesToDisplay = useAtomValue(changeCurrenciesToDisplayAtom)
  const [tempSelection, setTempSelection] = useState(selectedCurrencyCode)

  const handleSave = useCallback(() => {
    if (tempSelection) {
      onSave(tempSelection)
    }
    onClose()
  }, [tempSelection, onSave, onClose])

  const rightActions = useMemo(
    () => [{icon: XmarkCancelClose, onPress: onClose}],
    [onClose]
  )

  const renderItem = useCallback(
    ({item}: {item: CurrencyInfo}) => (
      <CurrencyItem
        item={item}
        selected={item.code === tempSelection}
        onSelect={setTempSelection}
      />
    ),
    [tempSelection]
  )

  const keyExtractor = useCallback((item: CurrencyInfo) => item.code, [])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('offerForm.selectCurrency')}
          rightActions={rightActions}
        />
      }
      footer={<Button onPress={handleSave}>{t('common.save')}</Button>}
    >
      <SearchBar
        valueAtom={changeCurrencySearchTextAtom}
        placeholder={t('common.search')}
        marginBottom="$4"
      />
      {Array.isNonEmptyArray(currenciesToDisplay) ? (
        <FlashList
          data={currenciesToDisplay}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getTokens().space.$13.val,
          }}
        />
      ) : (
        <Stack ai="center" gap="$4" p="$6">
          <Typography variant="heading3" ta="center" color="$foregroundPrimary">
            {t('common.nothingFound')}
          </Typography>
          <Typography
            variant="description"
            ta="center"
            color="$foregroundSecondary"
          >
            {t('changeCurrency.trySearchingByCurrencyName')}
          </Typography>
        </Stack>
      )}
    </Screen>
  )
}

export function useOpenChangeCurrency(): (
  config: ChangeCurrencyConfig
) => void {
  const setSearchText = useSetAtom(changeCurrencySearchTextAtom)
  const setConfig = useSetAtom(changeCurrencyConfigAtom)
  const navigation =
    useNavigation<RootStackScreenProps<'ChangeCurrency'>['navigation']>()

  return useCallback(
    (config: ChangeCurrencyConfig) => {
      setSearchText('')
      setConfig(config)
      navigation.navigate('ChangeCurrency')
    },
    [navigation, setConfig, setSearchText]
  )
}

export function ChangeCurrencyScreen({
  navigation,
}: RootStackScreenProps<'ChangeCurrency'>): React.JSX.Element | null {
  const setSearchText = useSetAtom(changeCurrencySearchTextAtom)
  const setConfig = useSetAtom(changeCurrencyConfigAtom)
  const config = useAtomValue(changeCurrencyConfigAtom)

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  useFocusEffect(
    useCallback(() => {
      setSearchText('')
      return () => {
        setConfig(undefined)
      }
    }, [setConfig, setSearchText])
  )

  useEffect(() => {
    if (!config) {
      navigation.goBack()
    }
  }, [config, navigation])

  if (!config) return null

  return (
    <ChangeCurrencyContent
      selectedCurrencyCode={config.selectedCurrencyCode}
      onSave={config.onSave}
      onClose={handleClose}
    />
  )
}
