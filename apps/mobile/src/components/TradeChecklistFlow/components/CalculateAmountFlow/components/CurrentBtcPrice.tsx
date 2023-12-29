import {Text, type TextProps, XStack} from 'tamagui'
import {useAtomValue, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {
  refreshCurrentBtcPriceActionAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
} from '../atoms'
import * as fromChatAtoms from '../../../atoms/fromChatAtoms'
import {currentBtcPriceAtom} from '../../../../../state/currentBtcPriceAtoms'

function CurrentBtcPrice(props: TextProps): JSX.Element {
  const refreshCurrentBtcPrice = useSetAtom(refreshCurrentBtcPriceActionAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const tradeBtcPrice = useAtomValue(tradeBtcPriceAtom)
  const currentBtcPrice = useAtomValue(currentBtcPriceAtom)

  const tradeCurrency =
    useAtomValue(fromChatAtoms.originOfferAtom)?.offerInfo.publicPart
      .currency ?? 'USD'

  return (
    <TouchableOpacity
      disabled={tradePriceType !== 'live'}
      onPress={() => {
        void refreshCurrentBtcPrice()()
      }}
    >
      <XStack ai={'center'}>
        <Text fos={16} ff={'$body500'} col={'$greyOnBlack'} {...props}>
          {`1 BTC = ${
            tradePriceType === 'live' ? currentBtcPrice : tradeBtcPrice
          } ${tradeCurrency}`}
        </Text>
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrentBtcPrice
