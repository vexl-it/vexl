import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {useAtomValue, type Atom, type PrimitiveAtom} from 'jotai'
import {ActivityIndicator, TouchableOpacity} from 'react-native'
import {Text, XStack, getTokens, type TextProps} from 'tamagui'
import {getCurrentLocale} from '../utils/localization/I18nProvider'
import {currencies} from '../utils/localization/currency'
import {preferencesAtom} from '../utils/preferences'

interface Props extends TextProps {
  customBtcPrice?: number
  refreshBtcPrice: () => void
  currencyAtom: PrimitiveAtom<CurrencyCode | undefined>
  btcPriceWithStateAtom: Atom<BtcPriceDataWithState | undefined>
}

function CurrentBtcPrice({
  btcPriceWithStateAtom,
  customBtcPrice,
  refreshBtcPrice,
  currencyAtom,
  ...props
}: Props): JSX.Element {
  const currency = useAtomValue(currencyAtom) ?? currencies.USD.code
  const btcPriceWithState = useAtomValue(btcPriceWithStateAtom)
  const preferences = useAtomValue(preferencesAtom)
  const currentLocale = preferences.appLanguage ?? getCurrentLocale()

  return (
    <TouchableOpacity disabled={!!customBtcPrice} onPress={refreshBtcPrice}>
      <XStack ai="center">
        {btcPriceWithState?.state === 'loading' ? (
          <ActivityIndicator
            size="small"
            color={getTokens().color.greyOnBlack.val}
          />
        ) : (
          <Text fos={16} ff="$body500" col="$greyOnBlack" {...props}>
            {`1 BTC = ${
              customBtcPrice
                ? customBtcPrice.toLocaleString(currentLocale)
                : btcPriceWithState?.state === 'error'
                ? '-'
                : btcPriceWithState?.btcPrice.toLocaleString(currentLocale)
            } ${currency}`}
          </Text>
        )}
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrentBtcPrice
