import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {selectedCurrencyAtom} from '../../../../../state/selectedCurrency'
import {styled, Text} from 'tamagui'

export const ItemText = styled(Text, {
  fos: 18,
})

function SelectedCurrencyTitle(): JSX.Element {
  const {t} = useTranslation()
  const selectedCurrency = useAtomValue(selectedCurrencyAtom)
  return (
    <ItemText ff="$body500" col="$white">
      {selectedCurrency === 'USD'
        ? t('currency.unitedStatesDollar')
        : selectedCurrency === 'EUR'
        ? t('currency.euro')
        : t('currency.czechCrown')}
    </ItemText>
  )
}

export default SelectedCurrencyTitle
