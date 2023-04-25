import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import Image from '../../Image'
import {Fragment} from 'react'

export interface StackButtonProps {
  icon: SvgString
  text: string
  onPress: () => void
  isNegative: boolean
}

function StackButton({
  icon,
  text,
  onPress,
  isNegative,
}: StackButtonProps): JSX.Element {
  return (
    <TouchableOpacity onPress={onPress}>
      <XStack px={'$4'} py={'$4'} space="$3" alignItems={'center'}>
        <Image
          stroke={
            isNegative
              ? getTokens().color.red.val
              : getTokens().color.greyOnBlack.val
          }
          width={24}
          height={24}
          source={icon}
        />
        <Text
          color={isNegative ? '$red' : '$white'}
          fontSize={18}
          fontFamily="$body500"
        >
          {text}
        </Text>
      </XStack>
    </TouchableOpacity>
  )
}

export interface Props {
  buttons: StackButtonProps[]
}

function ButtonStack({buttons}: Props): JSX.Element {
  return (
    <YStack backgroundColor="$blackAccent1" borderRadius={'$true'}>
      {buttons.map((one, i) => (
        <Fragment key={one.text}>
          {i !== 0 && <Stack mx={'$6'} height={2} backgroundColor={'$grey'} />}
          <StackButton {...one} />
        </Fragment>
      ))}
    </YStack>
  )
}

export default ButtonStack
