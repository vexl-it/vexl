import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import Image from './Image'
import checkmarkInCircleSvg from './images/checkmarkInCircleSvg'

export interface SelectableCellContentProps<T> {
  title: string
  subtitle?: string
  type: T
}
export interface Props<T> extends SelectableCellContentProps<T> {
  fullWidth?: boolean
  selected: boolean
  disabled?: boolean
  onPress: (_: T) => void
  size?: 'small' | 'large'
  variant?: 'dark' | 'light'
}
function SelectableCell<T>({
  fullWidth = true,
  selected,
  disabled,
  title,
  type,
  onPress,
  subtitle,
  size = 'large',
  variant = 'dark',
}: Props<T>): JSX.Element {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={() => {
        onPress(type)
      }}
    >
      <Stack
        als={fullWidth ? 'auto' : 'flex-start'}
        br="$4"
        p={size === 'large' ? '$4' : '$3'}
        bc={
          selected
            ? '$darkBrown'
            : variant === 'dark'
              ? '$grey'
              : '$greyAccent2'
        }
      >
        <XStack ai={!subtitle ? 'center' : 'flex-start'} gap="$2">
          {selected ? (
            <Image
              width={size === 'large' ? 20 : 16}
              height={size === 'large' ? 20 : 16}
              source={checkmarkInCircleSvg}
            />
          ) : (
            <Stack
              width={size === 'large' ? 20 : 16}
              height={size === 'large' ? 20 : 16}
              ai="center"
              jc="center"
              bw={1}
              bc={selected ? '$main' : 'transparent'}
              borderColor={
                selected
                  ? '$main'
                  : variant === 'dark'
                    ? '$greyAccent2'
                    : '$white'
              }
              br={20}
            />
          )}
          <Stack fs={1}>
            <Text
              ff="$body600"
              fos={size === 'large' ? 18 : 14}
              col={selected ? '$main' : '$white'}
            >
              {title}
            </Text>
            {!!subtitle && (
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
