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
  Typography,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {Array} from 'effect'
import {
  useAtom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type PrimitiveAtom,
} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Modal} from 'react-native'
import {Stack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {
  changeCurrenciesToDisplayAtom,
  changeCurrencySearchTextAtom,
} from './atoms'

interface ChangeCurrencyProps {
  readonly selectedCurrencyCodeAtom: Atom<CurrencyCode | undefined>
  readonly onSave: (currency: CurrencyCode) => void
  readonly visibleAtom: PrimitiveAtom<boolean>
}

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
  selectedCurrencyCodeAtom,
  onSave,
  onClose,
}: {
  readonly selectedCurrencyCodeAtom: Atom<CurrencyCode | undefined>
  readonly onSave: (currency: CurrencyCode) => void
  readonly onClose: () => void
}): React.JSX.Element {
  const {t} = useTranslation()
  const currentCurrency = useAtomValue(selectedCurrencyCodeAtom)
  const currenciesToDisplay = useAtomValue(changeCurrenciesToDisplayAtom)
  const [tempSelection, setTempSelection] = useState(currentCurrency)

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
      navigationBar={<NavigationBar style="back" rightActions={rightActions} />}
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
        />
      ) : (
        <Stack ai="center" gap="$4" p="$6">
          <Typography variant="heading3" ta="center" col="$foregroundPrimary">
            {t('common.nothingFound')}
          </Typography>
          <Typography
            variant="description"
            ta="center"
            col="$foregroundSecondary"
          >
            {t('changeCurrency.trySearchingByCurrencyName')}
          </Typography>
        </Stack>
      )}
    </Screen>
  )
}

export function ChangeCurrency({
  selectedCurrencyCodeAtom,
  onSave,
  visibleAtom,
}: ChangeCurrencyProps): React.JSX.Element | null {
  const [visible, setVisible] = useAtom(visibleAtom)
  const setSearchText = useSetAtom(changeCurrencySearchTextAtom)

  useEffect(() => {
    if (visible) {
      setSearchText('')
    }
  }, [visible, setSearchText])

  const handleClose = useCallback(() => {
    setVisible(false)
  }, [setVisible])

  if (!visible) return null

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <ChangeCurrencyContent
        selectedCurrencyCodeAtom={selectedCurrencyCodeAtom}
        onSave={onSave}
        onClose={handleClose}
      />
    </Modal>
  )
}
