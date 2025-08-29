import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {useAtom, useAtomValue, type Atom, type PrimitiveAtom} from 'jotai'
import React from 'react'
import {Modal} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import ScreenTitle from '../ScreenTitle'
import {currenciesToDisplayAtomsAtom} from './atom'
import CurrenciesList from './components/CurrenciesList'
import NothingFound from './components/NothingFound'
import SearchBar from './components/SearchBar'

interface Props {
  selectedCurrencyCodeAtom: Atom<CurrencyCode | undefined>
  onItemPress: (currency: CurrencyCode) => void
  visibleAtom: PrimitiveAtom<boolean>
}

function CurrencySelect({
  selectedCurrencyCodeAtom,
  onItemPress,
  visibleAtom,
}: Props): React.ReactElement | null {
  const {t} = useTranslation()
  const [visible, setVisible] = useAtom(visibleAtom)
  const toDisplay = useAtomValue(currenciesToDisplayAtomsAtom)
  const {bottom, top} = useSafeAreaInsets()

  if (!visible) return null

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Stack f={1} bc="$grey" px="$4" pb={bottom} pt={top}>
        <Stack pb="$2">
          <ScreenTitle
            text={t('offerForm.selectCurrency')}
            textColor="$greyAccent5"
            withBackButton
            onBackButtonPress={() => {
              setVisible(false)
            }}
          />
          <SearchBar autoFocus />
        </Stack>
        {toDisplay.length > 0 && (
          <CurrenciesList
            currencies={toDisplay}
            selectedCurrencyCodeAtom={selectedCurrencyCodeAtom}
            onItemPress={(currency) => {
              setVisible(false)
              onItemPress(currency)
            }}
          />
        )}
        {toDisplay.length === 0 && <NothingFound />}
      </Stack>
    </Modal>
  )
}

export default CurrencySelect
