import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {useCallback, useMemo} from 'react'
import {
  TouchableOpacity,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import {Stack, getTokens, styled} from 'tamagui'
import Image from './Image'

interface Props {
  width?: number
  height?: number
  borderRadius?: number
  disabled?: boolean
  icon: SvgString
  iconFill?: ColorValue
  onPress: () => void
  style?: StyleProp<ViewStyle>
  variant?: 'dark' | 'light' | 'primary' | 'negative' | 'secondary' | 'plain'
  oval?: boolean
  iconWidth?: number
  iconHeight?: number
}

const PressableStyled = styled(Stack, {
  ai: 'center',
  jc: 'center',
  p: '$3',
  variants: {
    variant: {
      dark: {
        bg: '$grey',
      },
      light: {
        bg: '$greyAccent4',
      },
      primary: {
        bg: '$darkBrown',
      },
      secondary: {
        bg: '$main',
      },
      negative: {
        bg: '$darkRed',
      },
      plain: {
        bg: 'transparent',
      },
    },
    oval: {
      true: {
        br: 20,
      },
      false: {
        'br': '$5',
      },
    },
  },
} as const)

function IconButton({
  variant = 'dark',
  disabled,
  icon,
  iconFill,
  onPress,
  borderRadius,
  width,
  height,
  style,
  oval,
  iconWidth,
  iconHeight,
}: Props): JSX.Element {
  const onPressInner = useCallback(() => {
    if (!disabled) onPress()
  }, [disabled, onPress])
  const tokens = getTokens()

  const touchableStyles = useMemo(
    () => ({width: width ?? 40, height: height ?? 40}),
    [width, height]
  )

  return (
    // has to be wrapped in TouchableOpacity as tamagui does not support onPress action on
    // wrapped TouchableOpacity in styled as of v 1.11.1
    <TouchableOpacity
      disabled={disabled}
      onPress={onPressInner}
      style={touchableStyles}
    >
      <PressableStyled
        oval={!!oval}
        borderRadius={borderRadius}
        variant={variant}
        style={[style, touchableStyles]}
        disabled={disabled}
      >
        <Image
          width={iconWidth ?? 20}
          height={iconHeight ?? 20}
          stroke={
            !iconFill
              ? variant === 'dark'
                ? tokens.color.white.val
                : variant === 'primary'
                ? tokens.color.main.val
                : variant === 'negative'
                ? tokens.color.red.val
                : variant === 'secondary'
                ? tokens.color.darkBrown.val
                : tokens.color.grey.val
              : 'none'
          }
          fill={iconFill ?? 'none'}
          source={icon}
        />
      </PressableStyled>
    </TouchableOpacity>
  )
}

export default IconButton
