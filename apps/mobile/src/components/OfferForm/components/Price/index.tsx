import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {
  type CurrencyCode,
  type SinglePriceState,
} from '@vexl-next/domain/src/general/offers'
import {useAtom, type Atom, type PrimitiveAtom, type WritableAtom} from 'jotai'
import {useCallback} from 'react'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import SvgImage from '../../../Image'
import Switch from '../../../Switch'
import priceTagSvg from '../../../images/priceTagSvg'
import PriceCalculator from './components/PriceCalculator'

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
  singlePriceStateAtom: PrimitiveAtom<SinglePriceState>
  toggleCurrencyActionAtom: WritableAtom<
    null,
    [currencyCode: CurrencyCode],
    void
  >
}

function Price({
  btcPriceForOfferWithCurrencyAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  calculateFiatValueOnSatsValueChangeActionAtom,
  currencyAtom,
  satsValueAtom,
  singlePriceValueAtom,
  singlePriceStateAtom,
  toggleCurrencyActionAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const [singlePriceState, setSinglePriceState] = useAtom(singlePriceStateAtom)

  const onSwitchValueChange = useCallback(() => {
    setSinglePriceState(
      singlePriceState === 'HAS_COST' ? 'FOR_FREE' : 'HAS_COST'
    )
  }, [setSinglePriceState, singlePriceState])

  return (
    <YStack mb="$4">
      <XStack ai="center" jc="space-between" py="$4">
        <XStack f={1} ai="center" mr="$1">
          <Stack mr="$2">
            <SvgImage
              height={24}
              width={24}
              stroke={
                singlePriceState === 'HAS_COST'
                  ? tokens.color.white.val
                  : tokens.color.greyOnWhite.val
              }
              source={priceTagSvg}
            />
          </Stack>
          <Stack fs={1}>
            <Text
              numberOfLines={2}
              ff="$body700"
              col={singlePriceState === 'HAS_COST' ? '$white' : '$greyOnWhite'}
              fos={24}
            >
              {t('offerForm.price')}
            </Text>
          </Stack>
        </XStack>
        <Switch
          value={singlePriceState === 'HAS_COST'}
          onValueChange={onSwitchValueChange}
        />
      </XStack>
      <Text
        ff="$body600"
        mb="$4"
        col={singlePriceState === 'HAS_COST' ? '$white' : '$greyOnWhite'}
        fos={16}
      >
        {singlePriceState === 'HAS_COST'
          ? t('offerForm.thePriceIsFixedToFiat')
          : t('offerForm.thisItemWillBeFree')}
      </Text>
      {singlePriceState === 'HAS_COST' && (
        <PriceCalculator
          btcPriceForOfferWithCurrencyAtom={btcPriceForOfferWithCurrencyAtom}
          calculateSatsValueOnFiatValueChangeActionAtom={
            calculateSatsValueOnFiatValueChangeActionAtom
          }
          calculateFiatValueOnSatsValueChangeActionAtom={
            calculateFiatValueOnSatsValueChangeActionAtom
          }
          currencyAtom={currencyAtom}
          satsValueAtom={satsValueAtom}
          singlePriceValueAtom={singlePriceValueAtom}
          toggleCurrencyActionAtom={toggleCurrencyActionAtom}
        />
      )}
    </YStack>
  )
}

export default Price
