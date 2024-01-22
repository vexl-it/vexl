import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import Image from './Image'
import checkmarkSvg from './images/checkmarkSvg'

export interface SelectableCellContentProps<T> {
  title: string
  subtitle?: string
  type: T
}
export interface Props<T> extends SelectableCellContentProps<T> {
  fullWidth?: boolean
  selected: boolean
  onPress: (_: T) => void
  size?: 'small' | 'large'
}
function SelectableCell<T>({
  fullWidth = true,
  selected,
  title,
  type,
  onPress,
  subtitle,
  size = 'large',
}: Props<T>): JSX.Element {
  const tokens = getTokens()

  return (
    <TouchableOpacity
      onPress={() => {
        onPress(type)
      }}
    >
      <Stack
        als={fullWidth ? 'auto' : 'flex-start'}
        br="$4"
        p={size === 'large' ? '$4' : '$3'}
        bg={selected ? '$darkBrown' : '$grey'}
      >
        <XStack>
          {selected ? (
            <Image
              width={size === 'large' ? 24 : 16}
              height={size === 'large' ? 24 : 16}
              source={checkmarkSvg}
              stroke={tokens.color.main.val}
            />
          ) : (
            <Stack w={17} />
          )}
          <Stack fs={1} ml="$2">
            <Text
              ff={size === 'large' ? '$body700' : '$body600'}
              fos={size === 'large' ? 18 : 14}
              col={selected ? '$main' : '$greyOnBlack'}
            >
              {title}
            </Text>
            {subtitle && (
              <Text fos={14} col={selected ? '$main' : '$greyOnBlack'} mt="$2">
                {subtitle}
              </Text>
            )}
          </Stack>
        </XStack>
      </Stack>
    </TouchableOpacity>
  )
}

export default SelectableCell
