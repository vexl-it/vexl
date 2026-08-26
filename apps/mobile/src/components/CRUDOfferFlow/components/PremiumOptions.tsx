import {BuySellRangeSlider, Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {XStack, YStack} from 'tamagui'
import {currencies} from '../../../utils/localization/currency'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {getInfoText, SLIDER_THRESHOLD} from '../../../utils/premiumOrDiscount'
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

  const priceTagText =
    feeAmount === 0
      ? t('offerForm.premiumOrDiscount.marketPrice')
      : `${feeAmount > 0 ? '+' : ''}${feeAmount} %`

  const infoText = getInfoText(feeAmount, isBuy, t)

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

        <XStack alignItems="center" justifyContent="space-between">
          <Typography variant="paragraphDemibold" color="$foregroundPrimary">
            {isBuy
              ? t('offerForm.premiumOrDiscount.youBuyBtcFor')
              : t('offerForm.premiumOrDiscount.youSellBtcFor')}
          </Typography>
          <XStack
            backgroundColor="$backgroundSecondary"
            paddingHorizontal="$4"
            paddingVertical="$3"
            borderRadius="$3"
          >
            <Typography variant="paragraphSmall" color="$foregroundPrimary">
              {priceTagText}
            </Typography>
          </XStack>
        </XStack>

        <BuySellRangeSlider
          leftLabel={
            isBuy
              ? t('offerForm.premiumOrDiscount.buyCheaply')
              : t('offerForm.premiumOrDiscount.sellFaster')
          }
          rightLabel={
            isBuy
              ? t('offerForm.premiumOrDiscount.buyFaster')
              : t('offerForm.premiumOrDiscount.earnMore')
          }
          minPercentage={-SLIDER_THRESHOLD}
          maxPercentage={SLIDER_THRESHOLD}
          percentage={feeAmount}
          onPercentageChange={handlePercentageChange}
          infoText={infoText}
          amountText={amountText}
        />
      </YStack>
    </MoreOptions>
  )
}

export default PremiumOptions
