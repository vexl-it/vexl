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
import {
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
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
  const locale = getCurrentLocale()
  const {
    currencyAtom,
    maxAmountForCurrencyAtom,
    btcPricesReadyAtom,
    amountTopLimitForRangeInputAtom,
    amountBottomLimitForRangeInputAtom,
    btcPriceForOfferWithCurrencyAtom,
    changePriceCurrencyActionAtom,
  } = useMolecule(offerFormMolecule)

  const currency = useAtomValue(currencyAtom)
  const btcPriceData = useAtomValue(btcPriceForOfferWithCurrencyAtom)
  const changePriceCurrency = useSetAtom(changePriceCurrencyActionAtom)
  const openChangeCurrency = useOpenChangeCurrency()
  const amountMin = useAtomValue(amountBottomLimitForRangeInputAtom)
  const amountMax = useAtomValue(amountTopLimitForRangeInputAtom)
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
    const formatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    })
    return `${formatter.format(amountMin)} – ${formatter.format(amountMax)} ${currencies[currency].code}`
  }, [amountMin, amountMax, currency, locale])

  if (!currency) return null

  if (!active) {
    return (
      <EditRow
        state="completed"
        icon={icon}
        overline={overline ?? t('offerForm.selectAmount')}
        headline={amountLabel}
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
