import {
  type CurrencyCode,
  type SinglePriceState,
} from '@vexl-next/domain/src/general/offers'
import {useAtom, type PrimitiveAtom, type WritableAtom} from 'jotai'
import {useCallback} from 'react'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import SvgImage from '../../../Image'
import Switch from '../../../Switch'
import priceTagSvg from '../../../images/priceTagSvg'
import PriceCalculator from './components/PriceCalculator'

interface Props {
  inFilter?: boolean
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
  singlePriceStateAtom: PrimitiveAtom<SinglePriceState | undefined>
  changePriceCurrencyActionAtom: WritableAtom<
    null,
    [currencyCode: CurrencyCode],
    void
  >
}

function Price({
  inFilter,
  priceAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  calculateFiatValueOnSatsValueChangeActionAtom,
  currencyAtom,
  satsValueAtom,
  singlePriceStateAtom,
  changePriceCurrencyActionAtom,
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
                singlePriceState === 'HAS_COST' || inFilter
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
              col={
                singlePriceState === 'HAS_COST' || inFilter
                  ? '$white'
                  : '$greyOnWhite'
              }
              fos={24}
            >
              {!inFilter ? t('offerForm.price') : t('filterOffers.priceUpTo')}
            </Text>
          </Stack>
        </XStack>
        {!inFilter && (
          <Switch
            value={singlePriceState === 'HAS_COST'}
            onValueChange={onSwitchValueChange}
          />
        )}
      </XStack>
      <Text
        ff="$body600"
        mb="$4"
        col={
          singlePriceState === 'HAS_COST' || inFilter
            ? '$white'
            : '$greyOnWhite'
        }
        fos={16}
      >
        {inFilter
          ? t('filterOffers.filteredAccordingToValueInSats')
          : singlePriceState === 'HAS_COST'
          ? t('offerForm.thePriceIsFixedToFiat')
          : t('offerForm.thisItemDoesNotHaveSetPrice')}
      </Text>
      {!!(singlePriceState === 'HAS_COST' || inFilter) && (
        <PriceCalculator
          priceAtom={priceAtom}
          calculateSatsValueOnFiatValueChangeActionAtom={
            calculateSatsValueOnFiatValueChangeActionAtom
          }
          calculateFiatValueOnSatsValueChangeActionAtom={
            calculateFiatValueOnSatsValueChangeActionAtom
          }
          currencyAtom={currencyAtom}
          satsValueAtom={satsValueAtom}
          changePriceCurrencyActionAtom={changePriceCurrencyActionAtom}
        />
      )}
    </YStack>
  )
}

export default Price
