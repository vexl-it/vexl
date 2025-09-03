import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import React, {useCallback, useMemo, type ComponentProps} from 'react'
import {TouchableOpacity, type ColorValue} from 'react-native'
import {Stack, getTokens, styled} from 'tamagui'
import Image from './Image'

interface Props {
  testID?: string
  width?: number
  height?: number
  borderRadius?: number
  disabled?: boolean
  icon: SvgString
  iconFill?: ColorValue
  iconStroke?: ColorValue
  onPress: () => void
  style?: ComponentProps<typeof PressableStyled>['style']
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
  testID,
  variant = 'dark',
  disabled,
  icon,
  iconStroke,
  iconFill,
  onPress,
  borderRadius,
  width,
  height,
  style,
  oval,
  iconWidth,
  iconHeight,
}: Props): React.ReactElement {
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
      testID={testID}
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
            iconStroke ??
            (!iconFill
              ? variant === 'dark'
                ? tokens.color.white.val
                : variant === 'primary'
                  ? tokens.color.main.val
                  : variant === 'negative'
                    ? tokens.color.red.val
                    : variant === 'secondary'
                      ? tokens.color.darkBrown.val
                      : tokens.color.grey.val
              : 'none')
          }
          fill={iconFill ?? 'none'}
          source={icon}
        />
      </PressableStyled>
    </TouchableOpacity>
  )
}

export default IconButton
