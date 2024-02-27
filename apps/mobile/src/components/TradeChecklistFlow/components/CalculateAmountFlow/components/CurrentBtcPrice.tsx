import {useAtomValue, useSetAtom} from 'jotai'
import {ActivityIndicator, TouchableOpacity} from 'react-native'
import {Text, XStack, getTokens, type TextProps} from 'tamagui'
import {tradeOrOriginOfferCurrencyAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {getCurrentLocale} from '../../../../../utils/localization/I18nProvider'
import {preferencesAtom} from '../../../../../utils/preferences'
import {
  btcPriceForOfferWithStateAtom,
  refreshCurrentBtcPriceActionAtom,
  selectedCurrencyCodeAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
} from '../atoms'

function CurrentBtcPrice(props: TextProps): JSX.Element {
  const refreshCurrentBtcPrice = useSetAtom(refreshCurrentBtcPriceActionAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const tradeBtcPrice = useAtomValue(tradeBtcPriceAtom)
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const tradeOrOriginOfferCurrency = useAtomValue(
    tradeOrOriginOfferCurrencyAtom
  )
  const selectedCurrencyCode = useAtomValue(selectedCurrencyCodeAtom)
  const preferences = useAtomValue(preferencesAtom)
  const currentLocale = preferences.appLanguage ?? getCurrentLocale()

  const tradeCurrency =
    selectedCurrencyCode ?? tradeOrOriginOfferCurrency ?? 'USD'

  return (
    <TouchableOpacity
      disabled={tradePriceType !== 'live'}
      onPress={() => {
        void refreshCurrentBtcPrice()()
      }}
    >
      <XStack ai="center">
        {btcPriceForOfferWithState?.state === 'loading' ? (
          <ActivityIndicator
            size="small"
            color={getTokens().color.greyOnBlack.val}
          />
        ) : (
          <Text fos={16} ff="$body500" col="$greyOnBlack" {...props}>
            {`1 BTC = ${
              tradePriceType === 'live'
                ? btcPriceForOfferWithState?.state === 'error'
                  ? '-'
                  : btcPriceForOfferWithState?.btcPrice.toLocaleString(
                      currentLocale
                    )
                : tradeBtcPrice.toLocaleString(currentLocale)
            } ${tradeCurrency}`}
          </Text>
        )}
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrentBtcPrice
