import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {
  useAtom,
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import chevronRightSvg from '../../../images/chevronRightSvg'
import {type TradeCalculatorStackParamsList} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import Switch from '../../Switch'

interface Props {
  feeAmountAtom: PrimitiveAtom<number>
  togglePremiumOrDiscountActionAtom: WritableAtom<boolean, [], void>
  applyFeeOnFeeChangeActionAtom: WritableAtom<null, [feeAmount: number], void>
}

function PremiumOrDiscount({
  feeAmountAtom,
  togglePremiumOrDiscountActionAtom,
  applyFeeOnFeeChangeActionAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeCalculatorStackParamsList> =
    useNavigation()

  const [premiumOrDiscount, togglePremiumOrDiscount] = useAtom(
    togglePremiumOrDiscountActionAtom
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
          value={premiumOrDiscount}
          onChange={() => {
            togglePremiumOrDiscount()
            applyFeeOnFeeChange(0)
          }}
        />
      </XStack>
      {!!premiumOrDiscount && (
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
