import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {getTokens, Stack, XStack} from 'tamagui'
import {useAtomValue} from 'jotai'
import Image from '../../../../../../Image'
import chevronDownSvg from '../../../../../../../images/chevronDownSvg'
import PriceTypeIndicator from '../../PriceTypeIndicator'
import {tradePriceTypeAtom} from '../../../atoms'

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
