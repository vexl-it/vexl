import {
  Button,
  EditRow,
  Loader,
  PriceRangeInput,
  Typography,
} from '@vexl-next/ui'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {Stack, XStack, YStack} from 'tamagui'
import {currencies} from '../../../utils/localization/currency'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {getOfferAmountDetailsLabel} from '../../../utils/offerAmountDetails'
import BtcPriceInfo from '../../BtcPriceInfo'
import {useOpenChangeCurrency} from '../../ChangeCurrency'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import PremiumAndExpiration from './PremiumAndExpiration'

interface AmountStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: () => void
  readonly ctaLabel?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly overline?: string
}

function AmountStep({
  active,
  onEdit,
  onComplete,
  ctaLabel,
  icon,
  overline,
}: AmountStepProps): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {
    currencyAtom,
    maxAmountForCurrencyAtom,
    btcPricesReadyAtom,
    amountTopLimitForRangeInputAtom,
    amountBottomLimitForRangeInputAtom,
    feeAmountAtom,
    expirationDateAtom,
    btcPriceForOfferWithCurrencyAtom,
    changePriceCurrencyActionAtom,
  } = useMolecule(offerFormMolecule)

  const currency = useAtomValue(currencyAtom)
  const btcPriceData = useAtomValue(btcPriceForOfferWithCurrencyAtom)
  const changePriceCurrency = useSetAtom(changePriceCurrencyActionAtom)
  const openChangeCurrency = useOpenChangeCurrency()
  const amountMin = useAtomValue(amountBottomLimitForRangeInputAtom)
  const amountMax = useAtomValue(amountTopLimitForRangeInputAtom)
  const feeAmount = useAtomValue(feeAmountAtom)
  const expirationDate = useAtomValue(expirationDateAtom)
  const maxLimit = useAtomValue(maxAmountForCurrencyAtom)
  const pricesReady = useAtomValue(btcPricesReadyAtom)

  const handleCurrencyPress = useCallback(() => {
    openChangeCurrency({
      selectedCurrencyCode: currency,
      onSave: changePriceCurrency,
    })
  }, [changePriceCurrency, currency, openChangeCurrency])

  const amountLabel = useMemo(() => {
    if (!currency) return ''
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
      getOfferAmountDetailsLabel({
        feeAmount,
        expirationDate,
        locale,
        t,
      }),
    [expirationDate, feeAmount, locale, t]
  )

  if (!currency) return null

  if (!active) {
    return (
      <EditRow
        state="completed"
        icon={icon}
        overline={overline ?? t('offerForm.selectAmount')}
        headline={amountLabel}
        subheadline={amountDetailsLabel}
        onPress={onEdit}
      />
    )
  }

  return (
    <YStack>
      <EditRow state="initial" headline={t('offerForm.selectAmount')} />
      <YStack gap="$3" paddingVertical="$6">
        {!pricesReady ? (
          <XStack alignItems="center" gap="$3" paddingHorizontal="$4">
            <Loader size="small" />
            <Typography variant="description" color="$foregroundSecondary">
              {t('offerForm.loadingExchangeRate')}
            </Typography>
          </XStack>
        ) : null}
        <Stack
          opacity={pricesReady ? 1 : 0.5}
          pointerEvents={pricesReady ? 'auto' : 'none'}
        >
          <PriceRangeInput
            minValueAtom={amountBottomLimitForRangeInputAtom}
            maxValueAtom={amountTopLimitForRangeInputAtom}
            currency={currencies[currency].code}
            onCurrencyPress={handleCurrencyPress}
            maxLimit={maxLimit}
            locale={locale}
          />
        </Stack>
        <BtcPriceInfo btcPriceData={btcPriceData} currency={currency} />

        <PremiumAndExpiration amountMin={amountMin} amountMax={amountMax} />

        <Button
          variant="primary"
          size="large"
          disabled={!pricesReady}
          onPress={onComplete}
        >
          {ctaLabel ?? t('offerForm.next')}
        </Button>
      </YStack>
    </YStack>
  )
}

export default AmountStep
