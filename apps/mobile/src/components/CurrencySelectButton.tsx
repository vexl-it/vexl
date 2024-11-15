import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {useAtomValue, type Atom} from 'jotai'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {Text, XStack, getTokens} from 'tamagui'
import chevronDownSvg from '../images/chevronDownSvg'
import {currencies} from '../utils/localization/currency'
import Image from './Image'

interface Props extends TouchableOpacityProps {
  currencyAtom: Atom<CurrencyCode | undefined>
}

function CurrencySelectButton({currencyAtom, ...props}: Props): JSX.Element {
  const currency = useAtomValue(currencyAtom)

  return (
    <TouchableOpacity style={{width: 65}} {...props}>
      <XStack gap="$2">
        <Text fontSize={18} color="$white" fontFamily="$body500">
          {currency ?? currencies.USD.code}
        </Text>
        <Image
          source={chevronDownSvg}
          stroke={getTokens().color.greyOnBlack.val}
        />
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrencySelectButton
