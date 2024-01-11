import {getTokens, Text, type TextProps, XStack} from 'tamagui'
import {useAtomValue, useSetAtom} from 'jotai'
import {ActivityIndicator, TouchableOpacity} from 'react-native'
import {
  refreshCurrentBtcPriceActionAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
} from '../atoms'
import {btcPriceForOfferWithStateAtom} from '../../../atoms/btcPriceForOfferWithStateAtom'
import {originOfferCurrencyAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'

function CurrentBtcPrice(props: TextProps): JSX.Element {
  const refreshCurrentBtcPrice = useSetAtom(refreshCurrentBtcPriceActionAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const tradeBtcPrice = useAtomValue(tradeBtcPriceAtom)
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const originOfferCurrency = useAtomValue(originOfferCurrencyAtom)

  const tradeCurrency = originOfferCurrency ?? 'USD'

  return (
    <TouchableOpacity
      disabled={tradePriceType !== 'live'}
      onPress={() => {
        void refreshCurrentBtcPrice()()
      }}
    >
      <XStack ai={'center'}>
        {btcPriceForOfferWithState?.state === 'loading' ? (
          <ActivityIndicator
            size={'small'}
            color={getTokens().color.greyOnBlack.val}
          />
        ) : (
          <Text fos={16} ff={'$body500'} col={'$greyOnBlack'} {...props}>
            {`1 BTC = ${
              tradePriceType === 'live'
                ? btcPriceForOfferWithState?.state === 'error'
                  ? '-'
                  : btcPriceForOfferWithState?.btcPrice
                : tradeBtcPrice
            } ${tradeCurrency}`}
          </Text>
        )}
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrentBtcPrice
