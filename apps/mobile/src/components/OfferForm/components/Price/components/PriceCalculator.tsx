import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {type PrimitiveAtom, type WritableAtom} from 'jotai'
import {Stack, YStack, getTokens} from 'tamagui'
import CurrentBtcPrice from '../../../../CurrentBtcPrice'
import SvgImage from '../../../../Image'
import arrowsSvg from '../../../../images/arrowsSvg'
import FiatInput from './FiatInput'
import SatsInput from './SatsInput'

interface Props {
  priceAtom: PrimitiveAtom<number | undefined>
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
  changePriceCurrencyActionAtom: WritableAtom<
    null,
    [currencyCode: CurrencyCode],
    void
  >
}

function PriceCalculator({
  priceAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  calculateFiatValueOnSatsValueChangeActionAtom,
  currencyAtom,
  satsValueAtom,
  changePriceCurrencyActionAtom,
}: Props): JSX.Element {
  return (
    <YStack space="$2">
      <Stack als="flex-end">
        <CurrentBtcPrice currencyAtom={currencyAtom} />
      </Stack>
      <FiatInput
        priceAtom={priceAtom}
        calculateSatsValueOnFiatValueChangeActionAtom={
          calculateSatsValueOnFiatValueChangeActionAtom
        }
        currencyAtom={currencyAtom}
        changePriceCurrencyActionAtom={changePriceCurrencyActionAtom}
      />
      <SatsInput
        calculateFiatValueOnSatsValueChangeActionAtom={
          calculateFiatValueOnSatsValueChangeActionAtom
        }
        satsValueAtom={satsValueAtom}
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
