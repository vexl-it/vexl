import {Text, type TextProps, XStack} from 'tamagui'
import {useAtomValue, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {
  refreshCurrentBtcPriceActionAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
} from '../atoms'
import {offerForTradeChecklistAtom} from '../../../atoms'

function CurrentBtcPrice(props: TextProps): JSX.Element {
  const refreshCurrentBtcPrice = useSetAtom(refreshCurrentBtcPriceActionAtom)
  const tradeBtcPrice = useAtomValue(tradeBtcPriceAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)

  const tradeCurrency =
    useAtomValue(offerForTradeChecklistAtom)?.offerInfo.publicPart.currency ??
    'USD'

  return (
    <TouchableOpacity
      disabled={tradePriceType !== 'live'}
      onPress={() => {
        void refreshCurrentBtcPrice()()
      }}
    >
      <XStack ai={'center'}>
        <Text fos={16} ff={'$body500'} col={'$greyOnBlack'} {...props}>
          {tradeBtcPrice !== 0
            ? `1 BTC = ${tradeBtcPrice} ${tradeCurrency}`
            : ''}
        </Text>
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrentBtcPrice
