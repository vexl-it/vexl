import {Stack, Text, XStack} from 'tamagui'
import Image from '../../Image'
import checkmarkSvg from '../images/checkmarkSvg'
import {TouchableOpacity} from 'react-native'

export interface SelectableCellContentProps<T> {
  title: string
  subtitle?: string
  type: T
}
export interface Props<T> extends SelectableCellContentProps<T> {
  fullWidth?: boolean
  selected: boolean
  onPress: (_: T) => void
}
function SelectableCell<T>({
  fullWidth = true,
  selected,
  title,
  type,
  onPress,
  subtitle,
}: Props<T>): JSX.Element {
  return (
    <TouchableOpacity
      onPress={() => {
        onPress(type)
      }}
    >
      <Stack
        als={fullWidth ? 'auto' : 'flex-start'}
        br="$4"
        p="$4"
        bg={selected ? '$darkBrown' : '$grey'}
      >
        <XStack>
          {selected ? <Image source={checkmarkSvg} /> : <Stack w={17} />}
          <Stack fs={1} ml="$2">
            <Text
              ff="$body700"
              fos={18}
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
