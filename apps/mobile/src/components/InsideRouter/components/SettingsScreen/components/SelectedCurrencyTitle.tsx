import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {ItemText} from './ButtonsSection'
import {selectedCurrencyAtom} from '../../../../../state/selectedCurrency'

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
