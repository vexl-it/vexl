import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {useAtomValue, type PrimitiveAtom} from 'jotai'
import {useSetAtom} from 'jotai/index'
import {useMemo} from 'react'
import {ActivityIndicator, TouchableOpacity} from 'react-native'
import {Text, XStack, getTokens, type TextProps} from 'tamagui'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../state/currentBtcPriceAtoms'
import {getCurrentLocale} from '../utils/localization/I18nProvider'
import {currencies} from '../utils/localization/currency'
import {preferencesAtom} from '../utils/preferences'

interface Props extends TextProps {
  customBtcPrice?: number
  currencyAtom: PrimitiveAtom<CurrencyCode | undefined>
  disabled?: boolean
}

function CurrentBtcPrice({
  customBtcPrice,
  currencyAtom,
  disabled,
  ...props
}: Props): JSX.Element {
  const currency = useAtomValue(currencyAtom) ?? currencies.USD.code
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const btcPriceWithState = useAtomValue(
    useMemo(() => createBtcPriceForCurrencyAtom(currency), [currency])
  )

  const preferences = useAtomValue(preferencesAtom)
  const currentLocale = preferences.appLanguage ?? getCurrentLocale()

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={() => {
        void refreshBtcPrice(currency)()
      }}
    >
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
