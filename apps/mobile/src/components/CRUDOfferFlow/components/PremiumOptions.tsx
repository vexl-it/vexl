import {Typography, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {currencies} from '../../../utils/localization/currency'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import PremiumOrDiscountSlider from '../../PremiumOrDiscountSlider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import MoreOptions from './MoreOptions'

interface Props {
  readonly amountMin: number
  readonly amountMax: number
}

function PremiumOptions({amountMin, amountMax}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {currencyAtom, feeAmountAtom, feeStateAtom, offerTypeAtom} =
    useMolecule(offerFormMolecule)

  const currency = useAtomValue(currencyAtom)
  const [feeAmount, setFeeAmount] = useAtom(feeAmountAtom)
  const setFeeState = useSetAtom(feeStateAtom)
  const offerType = useAtomValue(offerTypeAtom)
  const isBuy = offerType === 'BUY'

  const handlePercentageChange = useCallback(
    (value: number) => {
      setFeeAmount(value)
      setFeeState(value !== 0 ? 'WITH_FEE' : 'WITHOUT_FEE')
    },
    [setFeeAmount, setFeeState]
  )

  const amountText = useMemo(() => {
    const multiplier = 1 + feeAmount / 100
    const adjustedMin = Math.round(amountMin * multiplier)
    const adjustedMax = Math.round(amountMax * multiplier)
    const currencyCode = currencies[currency].code
    const minAmount = formatDecimal(adjustedMin, locale, {
      maximumFractionDigits: 0,
    })
    const maxAmount = formatDecimal(adjustedMax, locale, {
      maximumFractionDigits: 0,
    })
    const range = `${minAmount} – ${maxAmount} ${currencyCode}`
    return isBuy
      ? t('offerForm.premiumOrDiscount.youllPayAround', {amount: range})
      : t('offerForm.premiumOrDiscount.youllGetAround', {amount: range})
  }, [amountMin, amountMax, feeAmount, currency, locale, isBuy, t])

  return (
    <MoreOptions changedOptionsCount={feeAmount !== 0 ? 1 : 0}>
      <YStack gap="$3">
        <YStack gap="$3" paddingVertical="$3">
          <Typography variant="paragraphDemibold" color="$foregroundPrimary">
            {t('offerForm.premiumOrDiscount.premiumOrDiscount')}
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {isBuy
              ? t('offerForm.premiumOrDiscount.buyDescription')
              : t('offerForm.premiumOrDiscount.sellDescription')}
          </Typography>
        </YStack>

        <PremiumOrDiscountSlider
          feeAmount={feeAmount}
          onFeeAmountChange={handlePercentageChange}
          isBuy={isBuy}
          amountText={amountText}
        />
      </YStack>
    </MoreOptions>
  )
}

export default PremiumOptions
