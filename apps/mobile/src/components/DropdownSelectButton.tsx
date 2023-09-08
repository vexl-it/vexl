import {getTokens, XStack} from 'tamagui'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import Image from './Image'
import chevronDownSvg from '../images/chevronDownSvg'

interface Props extends TouchableOpacityProps {
  children: React.ReactNode
}

function DropdownSelectButton({children, ...props}: Props): JSX.Element {
  const tokens = getTokens()

  return (
    <TouchableOpacity {...props}>
      <XStack
        ai={'center'}
        jc={'space-between'}
        px={'$5'}
        py={'$4'}
        br={'$5'}
        bc={'$grey'}
      >
        {children}
        <Image stroke={tokens.color.greyOnBlack.val} source={chevronDownSvg} />
      </XStack>
    </TouchableOpacity>
  )
}

export default DropdownSelectButton
