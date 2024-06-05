import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import TradeCalculator from '../Calculator'
import IconButton from '../IconButton'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import closeSvg from '../images/closeSvg'
import {
  applyFeeOnFeeChangeActionAtom,
  btcInputValueAtom,
  btcOrSatsValueActionAtom,
  btcPriceCurrencyAtom,
  feeAmountAtom,
  fiatInputValueAtom,
  togglePremiumOrDiscountActionAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
} from './atoms'

function TradeCalculatorScreen(): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  return (
    <Screen customHorizontalPadding={getTokens().space[2].val}>
      <ScreenTitle text={t('changeProfilePicture.changeProfilePicture')}>
        <IconButton icon={closeSvg} onPress={safeGoBack} />
      </ScreenTitle>
      <TradeCalculator
        tradePriceTypeAtom={tradePriceTypeAtom}
        tradeBtcPriceAtom={tradeBtcPriceAtom}
        btcPriceCurrencyAtom={btcPriceCurrencyAtom}
        btcInputValueAtom={btcInputValueAtom}
        fiatInputValueAtom={fiatInputValueAtom}
        btcOrSatsValueActionAtom={btcOrSatsValueActionAtom}
        feeAmountAtom={feeAmountAtom}
        togglePremiumOrDiscountActionAtom={togglePremiumOrDiscountActionAtom}
        applyFeeOnFeeChangeActionAtom={applyFeeOnFeeChangeActionAtom}
      />
    </Screen>
  )
}

export default TradeCalculatorScreen
