import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {useAtom, type PrimitiveAtom, type WritableAtom} from 'jotai'
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
  toggleSinglePriceActiveAtom: WritableAtom<boolean, [isActive: boolean], any>
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
  toggleSinglePriceActiveAtom,
  changePriceCurrencyActionAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const [singlePriceActive, setSinglePriceActive] = useAtom(
    toggleSinglePriceActiveAtom
  )

  return (
    <YStack mb="$4">
      <XStack ai="center" jc="space-between" py="$4">
        <XStack f={1} ai="center" mr="$1">
          <Stack mr="$2">
            <SvgImage
              height={24}
              width={24}
              stroke={
                !!singlePriceActive || inFilter
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
              col={!!singlePriceActive || inFilter ? '$white' : '$greyOnWhite'}
              fos={24}
            >
              {!inFilter ? t('offerForm.price') : t('filterOffers.priceUpTo')}
            </Text>
          </Stack>
        </XStack>
        {!inFilter && (
          <Switch
            value={singlePriceActive}
            onValueChange={setSinglePriceActive}
          />
        )}
      </XStack>
      <Text
        ff="$body500"
        mb="$4"
        col={!!singlePriceActive || inFilter ? '$white' : '$greyOnWhite'}
        fos={16}
      >
        {inFilter
          ? t('filterOffers.filteredAccordingToValueInSats')
          : singlePriceActive
          ? t('offerForm.thePriceIsFixedToFiat')
          : t('offerForm.thisItemDoesNotHaveSetPrice')}
      </Text>
      {!!(!!singlePriceActive || inFilter) && (
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
