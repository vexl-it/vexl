import {useCallback, useMemo, useState} from 'react'
import {TouchableOpacity, TouchableWithoutFeedback} from 'react-native'
import {getTokens, Stack, styled, Text} from 'tamagui'
import Image from '../Image'
import chevronDownSvg from './images/chevronDownSvg'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

type Size = 'small' | 'large'

export interface RowProps<T> {
  type: T
  title: string
}

interface Props<T> {
  activeRowType: T | undefined
  placeholder?: string
  setActiveRowType: (rowType: T) => void
  rows: Array<RowProps<T>>
  size: Size
}

interface DropdownCellProps {
  isOpen: boolean
  isLast: boolean
  onPress: () => void
  title: string
  size: Size
}

const StyledRow = styled(Stack, {
  fd: 'row',
  ai: 'center',
  jc: 'space-between',
  px: '$5',
  py: '$4',
  variants: {
    isLast: {
      true: {
        borderBottomRightRadius: '$5',
        borderBottomLeftRadius: '$5',
      },
    },
    isOpen: {
      true: {
        bc: '$grey',
      },
      false: {
        bc: '$primary',
      },
    },
  },
})

function DropdownCell({
  title,
  isLast,
  isOpen,
  onPress,
  size,
}: DropdownCellProps): JSX.Element {
  return (
    <TouchableOpacity onPress={onPress}>
      <StyledRow isOpen={isOpen} isLast={isLast}>
        <Text
          ff={size === 'small' ? '$body' : '$body600'}
          fos={size === 'small' ? 16 : 18}
          col={'$greyOnBlack'}
        >
          {title}
        </Text>
      </StyledRow>
    </TouchableOpacity>
  )
}

function Dropdown<T>({
  activeRowType,
  placeholder,
  setActiveRowType,
  rows,
  size,
}: Props<T>): JSX.Element {
  const tokens = getTokens()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const activeRow = useMemo(
    () => rows.find((row) => row.type === activeRowType),
    [activeRowType, rows]
  )

  const rotation = useSharedValue(isOpen ? 180 : 0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{rotate: `${rotation.value}deg`}],
    }
  })

  const toggleRotation = useCallback(
    () => (rotation.value = withTiming(isOpen ? 0 : 180)),

    [isOpen, rotation]
  )

  return (
    <Stack>
      <TouchableWithoutFeedback
        onPress={() => {
          setIsOpen(!isOpen)
          toggleRotation()
        }}
      >
        <Stack
          fd={'row'}
          ai={'center'}
          jc={'space-between'}
          px={size === 'small' ? '$3' : '$5'}
          py={size === 'small' ? '$2' : '$4'}
          btlr={'$5'}
          btrr={'$5'}
          bbrr={isOpen ? '$0' : '$5'}
          bblr={isOpen ? '$0' : '$5'}
          bbw={isOpen ? 1 : 0}
          bbc={'$greyAccent1'}
          bc={'$grey'}
        >
          <Text
            ff={size === 'small' || !activeRow ? '$body' : '$body600'}
            fos={size === 'small' ? 16 : 18}
            col={size === 'small' || !activeRow ? '$greyOnBlack' : '$main'}
            mr={'$1'}
          >
            {activeRow?.title ?? placeholder}
          </Text>
          <Animated.View style={animatedStyle}>
            <Image
              height={size === 'small' ? 16 : 24}
              width={size === 'small' ? 16 : 24}
              stroke={
                size === 'small'
                  ? tokens.color.greyOnBlack.val
                  : tokens.color.main.val
              }
              source={chevronDownSvg}
            />
          </Animated.View>
        </Stack>
      </TouchableWithoutFeedback>
      {isOpen && (
        <Stack>
          {rows.map((row, index) => (
            <DropdownCell
              key={row.title}
              isOpen={isOpen}
              isLast={index === rows.length - 1}
              onPress={() => {
                setActiveRowType(row.type)
                setIsOpen(!isOpen)
                toggleRotation()
              }}
              title={row.title}
              size={size}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export default Dropdown
