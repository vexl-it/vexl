import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {Fragment} from 'react'
import {TouchableOpacity, type ColorValue} from 'react-native'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import Image from '../../Image'
import Switch from '../../Switch'

export interface StackButtonProps {
  displaySwitch?: boolean
  icon: SvgString
  iconFill?: ColorValue
  text: string
  onPress: () => void
  isNegative: boolean
  switchValue?: boolean
}

function StackButton({
  displaySwitch,
  icon,
  iconFill,
  text,
  onPress,
  isNegative,
  switchValue,
}: StackButtonProps): JSX.Element {
  return (
    <TouchableOpacity disabled={displaySwitch} onPress={onPress}>
      <XStack ai="center" jc="space-between" px="$4" py="$4">
        <XStack space="$3" ai="center">
          <Image
            stroke={
              isNegative
                ? getTokens().color.red.val
                : getTokens().color.greyOnBlack.val
            }
            fill={iconFill ?? 'none'}
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
        {!!displaySwitch && <Switch value={switchValue} onChange={onPress} />}
      </XStack>
    </TouchableOpacity>
  )
}

export interface Props {
  buttons: StackButtonProps[]
}

function ButtonStack({buttons}: Props): JSX.Element {
  return (
    <YStack backgroundColor="$blackAccent1" borderRadius="$true">
      {buttons.map((one, i) => (
        <Fragment key={one.text}>
          {i !== 0 && <Stack mx="$6" height={2} backgroundColor="$grey" />}
          <StackButton {...one} />
        </Fragment>
      ))}
    </YStack>
  )
}

export default ButtonStack
