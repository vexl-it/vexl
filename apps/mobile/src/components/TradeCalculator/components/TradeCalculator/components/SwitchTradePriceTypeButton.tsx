import {useAtomValue} from 'jotai'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {Stack, XStack, getTokens} from 'tamagui'
import chevronDownSvg from '../../../../../images/chevronDownSvg'
import Image from '../../../../Image'
import {tradePriceTypeAtom} from '../../../atoms'
import PriceTypeIndicator from '../../PriceTypeIndicator'

function SwitchTradePriceTypeButton(props: TouchableOpacityProps): JSX.Element {
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
              !tradePriceType || tradePriceType === 'live'
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
