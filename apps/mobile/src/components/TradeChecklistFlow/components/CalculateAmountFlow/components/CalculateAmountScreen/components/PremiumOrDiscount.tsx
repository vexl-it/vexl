import {getTokens, Stack, Text, XStack} from 'tamagui'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {
  applyFeeOnFeeChangeActionAtom,
  feeAmountAtom,
  premiumOrDiscountEnabledAtom,
} from '../../../atoms'
import chevronRightSvg from '../../../../../../../images/chevronRightSvg'
import Image from '../../../../../../Image'
import {TouchableOpacity} from 'react-native'
import Switch from '../../../../../../Switch'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../../../navigationTypes'

function PremiumOrDiscount(): JSX.Element {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
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
      {premiumOrDiscountEnabled && (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('PremiumOrDiscount')
          }}
        >
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
