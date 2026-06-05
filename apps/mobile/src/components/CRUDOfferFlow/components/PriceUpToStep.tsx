import {
  Button,
  EditRow,
  Exchange,
  Loader,
  Typography,
  type BtcUnit,
} from '@vexl-next/ui'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo, useState} from 'react'
import {XStack, YStack} from 'tamagui'
import {SATOSHIS_IN_BTC} from '../../../state/currentBtcPriceAtoms'
import {currencies} from '../../../utils/localization/currency'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {parseDecimalInput} from '../../../utils/normalizeDecimalInput'
import {getOfferAmountDetailsLabel} from '../../../utils/offerAmountDetails'
import BtcPriceInfo from '../../BtcPriceInfo'
import {useOpenChangeCurrency} from '../../ChangeCurrency'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import PremiumAndExpiration from './PremiumAndExpiration'

function satsToDisplayValue(satsValue: number, btcUnit: BtcUnit): string {
  if (!satsValue) return ''
  return btcUnit === 'SATS'
    ? String(satsValue)
    : (satsValue / SATOSHIS_IN_BTC).toString()
}

function displayValueToSatsString(
  value: string,
  btcUnit: BtcUnit
): string | null {
  if (!value) return '0'
  const num = parseDecimalInput(value)
  if (num === undefined) return null
  return btcUnit === 'BTC'
    ? Math.round(num * SATOSHIS_IN_BTC).toString()
    : String(num)
}

function formatFiatAmount(
  amount: number,
  currencyCode: string,
  locale: string
): string {
  return `${formatDecimal(amount, locale, {maximumFractionDigits: 0})} ${currencyCode}`
}

interface PriceUpToStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: () => void
  readonly ctaLabel?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly overline?: string
  readonly showInitialIcon?: boolean
}

function PriceUpToStep({
  active,
  onEdit,
  onComplete,
  ctaLabel,
  icon,
  overline,
  showInitialIcon,
}: PriceUpToStepProps): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {
    currencyAtom,
    amountBottomLimitAtom,
    satsValueAtom,
    btcPriceForOfferWithCurrencyAtom,
    btcPricesLoadingAtom,
    btcPricesReadyAtom,
    changePriceCurrencyActionAtom,
    calculateSatsValueOnFiatValueChangeActionAtom,
    calculateFiatValueOnSatsValueChangeActionAtom,
    checkAmountExceedsLimitAndShowDialogActionAtom,
    retryBtcPriceForOfferCurrencyActionAtom,
    expirationDateAtom,
  } = useMolecule(offerFormMolecule)

  const currency = useAtomValue(currencyAtom)
  const btcPriceData = useAtomValue(btcPriceForOfferWithCurrencyAtom)
  const amountBottomLimit = useAtomValue(amountBottomLimitAtom) ?? 0
  const satsValue = useAtomValue(satsValueAtom)
  const expirationDate = useAtomValue(expirationDateAtom)
  const pricesLoading = useAtomValue(btcPricesLoadingAtom)
  const pricesReady = useAtomValue(btcPricesReadyAtom)
  const changePriceCurrency = useSetAtom(changePriceCurrencyActionAtom)
  const retryBtcPrice = useSetAtom(retryBtcPriceForOfferCurrencyActionAtom)
  const openChangeCurrency = useOpenChangeCurrency()
  const calculateSatsOnFiatChange = useSetAtom(
    calculateSatsValueOnFiatValueChangeActionAtom
  )
  const calculateFiatOnSatsChange = useSetAtom(
    calculateFiatValueOnSatsValueChangeActionAtom
  )
  const checkAmountExceedsLimit = useSetAtom(
    checkAmountExceedsLimitAndShowDialogActionAtom
  )

  const [btcUnit, setBtcUnit] = useState<BtcUnit>('SATS')
  const [btcInputDraft, setBtcInputDraft] = useState<string | undefined>(
    undefined
  )
  const amountDetailsLabel = useMemo(
    () =>
      getOfferAmountDetailsLabel({
        expirationDate,
        locale,
        t,
      }),
    [expirationDate, locale, t]
  )

  if (!currency) return null

  const currencyCode = currencies[currency].code

  if (!active) {
    const completedHeadline = amountBottomLimit
      ? formatFiatAmount(amountBottomLimit, currencyCode, locale)
      : ''

    return (
      <EditRow
        state="completed"
        icon={icon}
        overline={overline ?? t('offerForm.priceUpTo')}
        headline={completedHeadline}
        subheadline={amountDetailsLabel}
        onPress={onEdit}
      />
    )
  }

  const btcValue = btcInputDraft ?? satsToDisplayValue(satsValue, btcUnit)
  const fiatValue = amountBottomLimit ? String(amountBottomLimit) : ''

  const hasPriceInput = amountBottomLimit > 0 || satsValue > 0
  const nextDisabled = !hasPriceInput || !pricesReady

  return (
    <YStack>
      <EditRow
        state="initial"
        headline={t('offerForm.priceUpTo')}
        showInitialIcon={showInitialIcon}
      />
      <YStack gap="$3" paddingVertical="$6">
        <Exchange
          btcValue={btcValue}
          btcUnit={btcUnit}
          onBtcUnitChange={(unit) => {
            setBtcInputDraft(undefined)
            setBtcUnit(unit)
          }}
          onToggleBtcUnit={() => {
            setBtcInputDraft(undefined)
            setBtcUnit((prev) => (prev === 'BTC' ? 'SATS' : 'BTC'))
          }}
          onBtcValueChange={(value) => {
            setBtcInputDraft(value)
            const satsString = displayValueToSatsString(value, btcUnit)
            if (satsString !== null) calculateFiatOnSatsChange(satsString)
          }}
          fiatValue={fiatValue}
          fiatCurrency={currencyCode}
          onFiatValueChange={(value) => {
            setBtcInputDraft(undefined)
            calculateSatsOnFiatChange(value)
          }}
          onFiatCurrencyPress={() => {
            openChangeCurrency({
              selectedCurrencyCode: currency,
              onSave: changePriceCurrency,
            })
          }}
          locale={locale}
        />
        <BtcPriceInfo
          btcPriceData={btcPriceData}
          currency={currency}
          isRefreshing={pricesLoading}
          onRetry={retryBtcPrice}
          showRetry={!pricesReady && !!btcPriceData}
        />

        <PremiumAndExpiration
          amountMin={amountBottomLimit}
          amountMax={amountBottomLimit}
          showPremium={false}
        />

        {pricesLoading ? (
          <XStack alignItems="center" gap="$3" paddingHorizontal="$4">
            <Loader size="small" />
            <Typography variant="description" color="$foregroundSecondary">
              {t('offerForm.loadingExchangeRate')}
            </Typography>
          </XStack>
        ) : null}

        <Button
          variant="primary"
          size="large"
          disabled={nextDisabled}
          onPress={() => {
            void Effect.runPromise(
              Effect.gen(function* (_) {
                const ok = yield* _(checkAmountExceedsLimit())
                if (ok) onComplete()
              })
            )
          }}
        >
          {ctaLabel ?? t('offerForm.next')}
        </Button>
      </YStack>
    </YStack>
  )
}

export default PriceUpToStep
