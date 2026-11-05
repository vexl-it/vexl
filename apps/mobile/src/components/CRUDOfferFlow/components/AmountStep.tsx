import {Button, EditStep, InfoBox, PriceRangeInput, Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {currencies} from '../../../utils/localization/currency'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {getOfferFeeLabel} from '../../../utils/offerAmountDetails'
import BtcPriceInfo from '../../BtcPriceInfo'
import {useOpenChangeCurrency} from '../../ChangeCurrency'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {type OfferFormStepProps} from '../offerSetupSteps'
import PremiumOptions from './PremiumOptions'

function AmountStep({
  onComplete,
  ctaLabel,
  ...stepProps
}: OfferFormStepProps): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {
    currencyAtom,
    maxAmountForCurrencyAtom,
    btcPricesLoadingAtom,
    btcPricesReadyAtom,
    amountTopLimitAtom,
    amountBottomLimitAtom,
    feeAmountAtom,
    btcPriceForOfferWithCurrencyAtom,
    changePriceCurrencyActionAtom,
    retryBtcPriceForOfferCurrencyActionAtom,
  } = useMolecule(offerFormMolecule)

  const currency = useAtomValue(currencyAtom)
  const btcPriceData = useAtomValue(btcPriceForOfferWithCurrencyAtom)
  const changePriceCurrency = useSetAtom(changePriceCurrencyActionAtom)
  const retryBtcPrice = useSetAtom(retryBtcPriceForOfferCurrencyActionAtom)
  const openChangeCurrency = useOpenChangeCurrency()
  const amountMin = useAtomValue(amountBottomLimitAtom)
  const amountMax = useAtomValue(amountTopLimitAtom)
  const feeAmount = useAtomValue(feeAmountAtom)
  const maxLimit = useAtomValue(maxAmountForCurrencyAtom)
  const pricesLoading = useAtomValue(btcPricesLoadingAtom)
  const pricesReady = useAtomValue(btcPricesReadyAtom)

  const handleCurrencyPress = useCallback(() => {
    openChangeCurrency({
      selectedCurrencyCode: currency,
      onSave: changePriceCurrency,
    })
  }, [changePriceCurrency, currency, openChangeCurrency])

  const amountLabel = useMemo(() => {
    const minAmount = formatDecimal(amountMin, locale, {
      maximumFractionDigits: 0,
    })
    const maxAmount = formatDecimal(amountMax, locale, {
      maximumFractionDigits: 0,
    })
    return `${minAmount} – ${maxAmount} ${currencies[currency].code}`
  }, [amountMin, amountMax, currency, locale])

  const amountDetailsLabel = useMemo(
    () =>
      getOfferFeeLabel({
        feeAmount,
        locale,
        t,
      }),
    [feeAmount, locale, t]
  )

  return (
    <EditStep
      {...stepProps}
      title={t('offerForm.selectAmount')}
      value={amountLabel}
      details={amountDetailsLabel}
      gap="$3"
    >
      {pricesLoading ? (
        <InfoBox variant="naked" loading paddingHorizontal="$4">
          {t('offerForm.loadingExchangeRate')}
        </InfoBox>
      ) : null}
      <Stack
        opacity={pricesLoading ? 0.5 : 1}
        pointerEvents={pricesLoading ? 'none' : 'auto'}
      >
        <PriceRangeInput
          minValueAtom={amountBottomLimitAtom}
          maxValueAtom={amountTopLimitAtom}
          currency={currencies[currency].code}
          onCurrencyPress={handleCurrencyPress}
          maxLimit={maxLimit}
          locale={locale}
        />
      </Stack>
      <BtcPriceInfo
        btcPriceData={btcPriceData}
        currency={currency}
        isRefreshing={pricesLoading}
        onRetry={retryBtcPrice}
        showRetry={!pricesReady && !!btcPriceData}
      />
      <PremiumOptions amountMin={amountMin} amountMax={amountMax} />
      <Button
        variant="primary"
        size="large"
        disabled={!pricesReady}
        onPress={onComplete}
      >
        {ctaLabel ?? t('offerForm.next')}
      </Button>
    </EditStep>
  )
}

export default AmountStep
