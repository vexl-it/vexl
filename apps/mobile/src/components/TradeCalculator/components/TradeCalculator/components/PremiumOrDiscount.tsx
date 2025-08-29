import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import chevronRightSvg from '../../../../../images/chevronRightSvg'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'
import Switch from '../../../../Switch'
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
  const [premiumOrDiscountEnabled, setPremiumOrDiscountEnabled] = useAtom(
    premiumOrDiscountEnabledAtom
  )
  const feeAmount = useAtomValue(feeAmountAtom)
  const applyFeeOnFeeChange = useSetAtom(applyFeeOnFeeChangeActionAtom)

  return (
    <Stack>
      <XStack ai="center" jc="space-between" mb="$4">
        <Text fos={20} ff="$body600" col="$white">{`% ${t(
          'tradeChecklist.calculateAmount.premiumOrDiscount'
        )}`}</Text>
        <Switch
          value={premiumOrDiscountEnabled}
          onChange={() => {
            setPremiumOrDiscountEnabled(!premiumOrDiscountEnabled)
            applyFeeOnFeeChange(0)
          }}
        />
      </XStack>
      {!!premiumOrDiscountEnabled && (
        <TouchableOpacity onPress={onPremiumOrDiscountPress}>
          <XStack
            h={56}
            ai="center"
            jc="space-between"
            bc="$grey"
            p="$4"
            br="$4"
          >
            <Text col="$greyOnBlack" fos={16} ff="$body500">
              {`${feeAmount > 0 ? '+' : feeAmount < 0 ? '-' : ''} ${Math.abs(
                feeAmount
              )} %`}
            </Text>
            <Image
              source={chevronRightSvg}
              stroke={getTokens().color.greyOnBlack.val}
            />
          </XStack>
        </TouchableOpacity>
      )}
    </Stack>
  )
}

export default PremiumOrDiscount
