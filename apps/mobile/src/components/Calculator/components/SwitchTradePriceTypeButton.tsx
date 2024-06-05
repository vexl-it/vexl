import {type TradePriceType} from '@vexl-next/domain/src/general/tradeChecklist'
import {useAtomValue, type PrimitiveAtom} from 'jotai'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {Stack, XStack, getTokens} from 'tamagui'
import chevronDownSvg from '../../../images/chevronDownSvg'
import Image from '../../Image'
import PriceTypeIndicator from '../../TradeCalculator/components/PriceTypeIndicator'

interface Props extends TouchableOpacityProps {
  tradePriceTypeAtom: PrimitiveAtom<TradePriceType | undefined>
}

function SwitchTradePriceTypeButton({
  tradePriceTypeAtom,
  ...props
}: Props): JSX.Element {
  const tradePriceType = useAtomValue(tradePriceTypeAtom)

  return (
    <TouchableOpacity {...props}>
      <XStack ai="center">
        <PriceTypeIndicator />
        <Stack ml="$1">
          <Image
            width={16}
            height={16}
            source={chevronDownSvg}
            stroke={
              tradePriceType === 'live'
                ? getTokens().color.main.val
                : tradePriceType === 'frozen'
                ? getTokens().color.pink.val
                : getTokens().color.green.val
            }
          />
        </Stack>
      </XStack>
    </TouchableOpacity>
  )
}

export default SwitchTradePriceTypeButton
