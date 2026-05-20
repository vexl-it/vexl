import {Exchange, InfoBox, YStack} from '@vexl-next/ui'
import {useAtom, useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import {btcPriceForOfferWithStateAtom, ownPriceAtom} from '../atoms'
import {normalizeInputString, parseNormalizedInput} from '../helpers'

interface Props {
  readonly fiatCurrency: string
}

function SetYourOwnPriceDialogContent({
  fiatCurrency,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const locale = getCurrentLocale()
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const [ownPrice, setOwnPrice] = useAtom(ownPriceAtom)
  const currentMarketPrice =
    btcPriceForOfferWithState?.state === 'success'
      ? btcPriceForOfferWithState.btcPrice.BTC
      : undefined

  const fiatPlaceholder =
    currentMarketPrice !== undefined
      ? currentMarketPrice.toLocaleString(locale, {
          maximumFractionDigits: 0,
        })
      : '-'

  const comparisonInfoText = useMemo(() => {
    if (!ownPrice || currentMarketPrice === undefined) {
      return t('tradeChecklist.calculateAmount.setOwnPriceForDeal')
    }

    const ownPriceNumber = parseNormalizedInput(ownPrice)

    if (ownPriceNumber <= 0) {
      return t('tradeChecklist.calculateAmount.setOwnPriceForDeal')
    }

    const priceDifferencePercentage =
      ((ownPriceNumber - currentMarketPrice) / currentMarketPrice) * 100
    const roundedPercentage = Math.abs(Math.round(priceDifferencePercentage))

    if (roundedPercentage === 0) {
      return t('tradeChecklist.calculateAmount.yourPriceMatchesMarket')
    }

    return t(
      priceDifferencePercentage < 0
        ? 'tradeChecklist.calculateAmount.yourPriceLowerThanMarket'
        : 'tradeChecklist.calculateAmount.yourPriceHigherThanMarket',
      {percentage: roundedPercentage}
    )
  }, [currentMarketPrice, ownPrice, t])

  return (
    <YStack gap="$4">
      <Exchange
        btcValue="1"
        btcUnit="BTC"
        btcEditable={false}
        onBtcUnitChange={() => {}}
        fiatValue={ownPrice ?? ''}
        fiatCurrency={fiatCurrency ?? 'USD'}
        fiatPlaceholder={fiatPlaceholder}
        fiatLoading={btcPriceForOfferWithState?.state === 'loading'}
        fiatAutoFocus
        fiatCurrencyEditable={false}
        onFiatCurrencyPress={() => {}}
        onFiatValueChange={(input) => {
          setOwnPrice(normalizeInputString(input))
        }}
        showSwapControl={false}
        locale={locale}
      />
      <InfoBox variant="yellow" p="$4" textMt={0}>
        {comparisonInfoText}
      </InfoBox>
    </YStack>
  )
}

export default SetYourOwnPriceDialogContent
