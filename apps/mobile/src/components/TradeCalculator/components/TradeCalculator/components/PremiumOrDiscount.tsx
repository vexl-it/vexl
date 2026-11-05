import {Selector, SwitchCard, YStack} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  feeAmountAtom,
  premiumOrDiscountEnabledAtom,
  premiumOrDiscountSwitchActionAtom,
} from '../../../atoms'

interface Props {
  readonly onPremiumOrDiscountPress: () => void
}

function formatFeeAmount(feeAmount: number): string {
  const sign = feeAmount > 0 ? '+' : feeAmount < 0 ? '-' : ''
  return `${sign} ${Math.abs(feeAmount)} %`
}

function PremiumOrDiscount({
  onPremiumOrDiscountPress,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const premiumOrDiscountEnabled = useAtomValue(premiumOrDiscountEnabledAtom)
  const feeAmount = useAtomValue(feeAmountAtom)

  return (
    <YStack gap="$4">
      <SwitchCard
        plain
        title={t('tradeChecklist.calculateAmount.premiumOrDiscount')}
        valueAtom={premiumOrDiscountSwitchActionAtom}
      />
      {!!premiumOrDiscountEnabled && (
        <Selector
          accent
          label={formatFeeAmount(feeAmount)}
          onPress={onPremiumOrDiscountPress}
        />
      )}
    </YStack>
  )
}

export default PremiumOrDiscount
