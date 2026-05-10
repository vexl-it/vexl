import {ChevronRight, Switch, Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {XStack, YStack, useTheme} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  feeAmountAtom,
  premiumOrDiscountEnabledAtom,
  premiumOrDiscountSwitchActionAtom,
} from '../../../atoms'

interface Props {
  readonly onPremiumOrDiscountPress: () => void
}

function PremiumOrDiscount({
  onPremiumOrDiscountPress,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const premiumOrDiscountEnabled = useAtomValue(premiumOrDiscountEnabledAtom)
  const feeAmount = useAtomValue(feeAmountAtom)

  return (
    <YStack gap="$4">
      <XStack ai="center" jc="space-between">
        <Typography variant="paragraphSmall" color="$foregroundPrimary">
          {t('tradeChecklist.calculateAmount.premiumOrDiscount')}
        </Typography>
        <Switch valueAtom={premiumOrDiscountSwitchActionAtom} />
      </XStack>
      {!!premiumOrDiscountEnabled && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPremiumOrDiscountPress}
        >
          <XStack
            minHeight="$11"
            ai="center"
            jc="space-between"
            backgroundColor="$backgroundSecondary"
            px="$5"
            py="$4"
            br="$5"
          >
            <Typography
              variant="paragraphSmall"
              color="$accentHighlightPrimary"
            >
              {`${feeAmount > 0 ? '+' : feeAmount < 0 ? '-' : ''} ${Math.abs(
                feeAmount
              )} %`}
            </Typography>
            <ChevronRight color={theme.accentHighlightPrimary.val} size={24} />
          </XStack>
        </TouchableOpacity>
      )}
    </YStack>
  )
}

export default PremiumOrDiscount
