import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {type PrimitiveAtom, type WritableAtom} from 'jotai'
import React from 'react'
import {Platform} from 'react-native'
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
  currencySelectVisibleAtom: PrimitiveAtom<boolean>
}

function PriceCalculator({
  priceAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  calculateFiatValueOnSatsValueChangeActionAtom,
  currencyAtom,
  satsValueAtom,
  changePriceCurrencyActionAtom,
  currencySelectVisibleAtom,
}: Props): React.ReactElement {
  return (
    <YStack gap="$2">
      <Stack als="flex-end">
        <CurrentBtcPrice currencyAtom={currencyAtom} />
      </Stack>
      <Stack gap="$2" pos="relative">
        <FiatInput
          priceAtom={priceAtom}
          calculateSatsValueOnFiatValueChangeActionAtom={
            calculateSatsValueOnFiatValueChangeActionAtom
          }
          currencyAtom={currencyAtom}
          changePriceCurrencyActionAtom={changePriceCurrencyActionAtom}
          currencySelectVisibleAtom={currencySelectVisibleAtom}
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
          top={Platform.OS === 'ios' ? 35 : 50}
        >
          <SvgImage
            width={24}
            height={24}
            stroke={getTokens().color.yellowAccent1.val}
            source={arrowsSvg}
          />
        </Stack>
      </Stack>
    </YStack>
  )
}

export default PriceCalculator
