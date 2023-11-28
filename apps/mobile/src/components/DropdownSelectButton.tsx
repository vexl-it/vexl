import {getTokens, XStack} from 'tamagui'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import Image from './Image'
import chevronDownSvg from '../images/chevronDownSvg'
import clearInputSvg from './images/clearInputSvg'

interface Props extends TouchableOpacityProps {
  children: React.ReactNode
  clearButtonVisible?: boolean
  onClearPress?: () => void
}

function DropdownSelectButton({
  children,
  clearButtonVisible,
  onClearPress,
  ...props
}: Props): JSX.Element {
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
        {clearButtonVisible ? (
          <TouchableOpacity onPress={onClearPress}>
            <Image
              height={22}
              stroke={getTokens().color.grey.val}
              source={clearInputSvg}
            />
          </TouchableOpacity>
        ) : (
          <Image
            stroke={tokens.color.greyOnBlack.val}
            source={chevronDownSvg}
          />
        )}
      </XStack>
    </TouchableOpacity>
  )
}

export default DropdownSelectButton
