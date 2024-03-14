import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {
  useSetAtom,
  type Atom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import {Stack, YStack, getTokens} from 'tamagui'
import {refreshBtcPriceActionAtom} from '../../../../../state/currentBtcPriceAtoms'
import CurrentBtcPrice from '../../../../CurrentBtcPrice'
import SvgImage from '../../../../Image'
import arrowsSvg from '../../../../images/arrowsSvg'
import FiatInput from './FiatInput'
import SatsInput from './SatsInput'

interface Props {
  btcPriceForOfferWithCurrencyAtom: Atom<BtcPriceDataWithState | undefined>
  calculateSatsValueOnFiatValueChangeActionAtom: WritableAtom<
    null,
    [priceString: string],
    void
  >
  calculateFiatValueOnSatsValueChangeActionAtom: WritableAtom<
    null,
    [satsString: string],
    void
  >
  currencyAtom: PrimitiveAtom<CurrencyCode | undefined>
  satsValueAtom: PrimitiveAtom<number>
  singlePriceValueAtom: PrimitiveAtom<number>
  toggleCurrencyActionAtom: WritableAtom<
    null,
    [currencyCode: CurrencyCode],
    void
  >
}

function PriceCalculator({
  btcPriceForOfferWithCurrencyAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  calculateFiatValueOnSatsValueChangeActionAtom,
  currencyAtom,
  satsValueAtom,
  singlePriceValueAtom,
  toggleCurrencyActionAtom,
}: Props): JSX.Element {
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)

  return (
    <YStack space="$2">
      <Stack als="flex-end">
        <CurrentBtcPrice
          btcPriceWithStateAtom={btcPriceForOfferWithCurrencyAtom}
          refreshBtcPrice={() => {
            void refreshBtcPrice(currencyAtom)()
          }}
          currencyAtom={currencyAtom}
        />
      </Stack>
      <SatsInput
        calculateFiatValueOnSatsValueChangeActionAtom={
          calculateFiatValueOnSatsValueChangeActionAtom
        }
        satsValueAtom={satsValueAtom}
      />
      <FiatInput
        calculateSatsValueOnFiatValueChangeActionAtom={
          calculateSatsValueOnFiatValueChangeActionAtom
        }
        currencyAtom={currencyAtom}
        singlePriceValueAtom={singlePriceValueAtom}
        toggleCurrencyActionAtom={toggleCurrencyActionAtom}
      />
      <Stack
        als="center"
        pos="absolute"
        br="$4"
        bc="$grey"
        boc="$yellowAccent1"
        p="$2"
        bw={2}
        zi={999}
        top={65}
      >
        <SvgImage
          width={24}
          height={24}
          stroke={getTokens().color.yellowAccent1.val}
          source={arrowsSvg}
        />
      </Stack>
    </YStack>
  )
}

export default PriceCalculator
