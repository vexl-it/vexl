import {ChevronRight, Switch, Typography} from '@vexl-next/ui'
import {atom, useAtomValue, type SetStateAction} from 'jotai'
import React, {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {XStack, YStack, useTheme} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  applyFeeOnFeeChangeActionAtom,
  feeAmountAtom,
  premiumOrDiscountEnabledAtom,
} from '../../../atoms'

interface Props {
  onPremiumOrDiscountPress: () => void
}

function PremiumOrDiscount({
  onPremiumOrDiscountPress,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const premiumOrDiscountEnabled = useAtomValue(premiumOrDiscountEnabledAtom)
  const feeAmount = useAtomValue(feeAmountAtom)
  const premiumOrDiscountSwitchAtom = useMemo(
    () =>
      atom(
        (get) => get(premiumOrDiscountEnabledAtom),
        (get, set, nextValue: SetStateAction<boolean>) => {
          const currentValue = get(premiumOrDiscountEnabledAtom)
          const next =
            typeof nextValue === 'function'
              ? nextValue(currentValue)
              : nextValue

          set(premiumOrDiscountEnabledAtom, next)
          set(applyFeeOnFeeChangeActionAtom, 0)
        }
      ),
    []
  )

  return (
    <YStack gap="$4">
      <XStack ai="center" jc="space-between">
        <Typography variant="paragraphSmall" color="$foregroundPrimary">
          {t('tradeChecklist.calculateAmount.premiumOrDiscount')}
        </Typography>
        <Switch valueAtom={premiumOrDiscountSwitchAtom} />
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
            <Typography variant="paragraphSmall" color="$foregroundPrimary">
              {`${feeAmount > 0 ? '+' : feeAmount < 0 ? '-' : ''} ${Math.abs(
                feeAmount
              )} %`}
            </Typography>
            <ChevronRight color={theme.foregroundPrimary.val} size={24} />
          </XStack>
        </TouchableOpacity>
      )}
    </YStack>
  )
}

export default PremiumOrDiscount
