import {
  Button,
  EditRow,
  Exchange,
  Loader,
  Typography,
  type BtcUnit,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {XStack, YStack} from 'tamagui'
import {SATOSHIS_IN_BTC} from '../../../state/currentBtcPriceAtoms'
import {currencies} from '../../../utils/localization/currency'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import BtcPriceInfo from '../../BtcPriceInfo'
import {ChangeCurrency} from '../../ChangeCurrency'
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
  const num = Number(value)
  if (Number.isNaN(num)) return null
  return btcUnit === 'BTC'
    ? Math.round(num * SATOSHIS_IN_BTC).toString()
    : value
}

function formatFiatAmount(
  amount: number,
  currencyCode: string,
  locale: string
): string {
  const formatter = new Intl.NumberFormat(locale, {maximumFractionDigits: 0})
  return `${formatter.format(amount)} ${currencyCode}`
}

interface PriceUpToStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: () => void
}

function PriceUpToStep({
  active,
  onEdit,
  onComplete,
}: PriceUpToStepProps): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = getCurrentLocale()
  const {
    currencyAtom,
    amountBottomLimitAtom,
    satsValueAtom,
    btcPriceForOfferWithCurrencyAtom,
    btcPricesReadyAtom,
    currencySelectVisibleAtom,
    changePriceCurrencyActionAtom,
    calculateSatsValueOnFiatValueChangeActionAtom,
    calculateFiatValueOnSatsValueChangeActionAtom,
    checkAmountExceedsLimitAndShowDialogActionAtom,
  } = useMolecule(offerFormMolecule)

  const currency = useAtomValue(currencyAtom)
  const btcPriceData = useAtomValue(btcPriceForOfferWithCurrencyAtom)
  const amountBottomLimit = useAtomValue(amountBottomLimitAtom) ?? 0
  const satsValue = useAtomValue(satsValueAtom)
  const pricesReady = useAtomValue(btcPricesReadyAtom)
  const setCurrencySelectVisible = useSetAtom(currencySelectVisibleAtom)
  const changePriceCurrency = useSetAtom(changePriceCurrencyActionAtom)
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

  if (!currency) return null

  const currencyCode = currencies[currency].code

  if (!active) {
    const completedHeadline = amountBottomLimit
      ? formatFiatAmount(amountBottomLimit, currencyCode, locale)
      : t('offerForm.anyPrice')

    return (
      <EditRow
        state="completed"
        overline={t('offerForm.priceUpTo')}
        headline={completedHeadline}
        onPress={onEdit}
      />
    )
  }

  const btcValue = satsToDisplayValue(satsValue, btcUnit)
  const fiatValue = amountBottomLimit ? String(amountBottomLimit) : ''

  // Step is optional — empty inputs can skip. But if the user has entered a
  // value we can't validate against the per-currency cap until prices load,
  // so block Next to avoid the 10 000 fallback mis-rejecting legitimate amounts.
  const hasPriceInput = amountBottomLimit > 0 || satsValue > 0
  const nextDisabled = hasPriceInput && !pricesReady

  return (
    <YStack>
      <EditRow
        state="initial"
        headline={t('offerForm.priceUpTo')}
        optionalLabel={t('offerForm.optional')}
      />
      <YStack gap="$3" paddingVertical="$6">
        <Exchange
          btcValue={btcValue}
          btcUnit={btcUnit}
          onBtcUnitChange={setBtcUnit}
          onToggleBtcUnit={() => {
            setBtcUnit((prev) => (prev === 'BTC' ? 'SATS' : 'BTC'))
          }}
          onBtcValueChange={(value) => {
            const satsString = displayValueToSatsString(value, btcUnit)
            if (satsString !== null) calculateFiatOnSatsChange(satsString)
          }}
          fiatValue={fiatValue}
          fiatCurrency={currencyCode}
          onFiatValueChange={calculateSatsOnFiatChange}
          onFiatCurrencyPress={() => {
            setCurrencySelectVisible(true)
          }}
          locale={locale}
        />
        <BtcPriceInfo btcPriceData={btcPriceData} currency={currency} />

        <PremiumAndExpiration
          amountMin={amountBottomLimit}
          amountMax={amountBottomLimit}
          showPremium={false}
        />

        {nextDisabled ? (
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
          {t('offerForm.next')}
        </Button>
      </YStack>

      <ChangeCurrency
        selectedCurrencyCodeAtom={currencyAtom}
        onSave={changePriceCurrency}
        visibleAtom={currencySelectVisibleAtom}
      />
    </YStack>
  )
}

export default PriceUpToStep
