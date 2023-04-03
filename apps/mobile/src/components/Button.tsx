import {
  type StyleProp,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native'
import styled from '@emotion/native'
import {useCallback} from 'react'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import Image from './Image'

interface Props {
  onPress: () => void
  variant: 'primary' | 'secondary' | 'black' | 'blackOnDark' | 'link'
  text?: string
  style?: StyleProp<ViewStyle>

  disabled?: boolean
  size?: 'small' | 'normal'
  fontSize?: number
  afterIcon?: SvgString
}

interface StyledElementsProps
  extends Pick<Props, 'variant' | 'disabled' | 'size' | 'fontSize'> {}

const PressableStyled = styled(TouchableOpacity)<StyledElementsProps>`
  ${(props) =>
    props.variant === 'primary' &&
    `
        background-color: ${props.theme.colors.darkBrown};
    `}
  ${(props) =>
    props.variant === 'secondary' &&
    `
        background-color: ${props.theme.colors.main};
    `}
  
  
  ${(props) =>
    props.variant === 'black' &&
    `
        background-color: ${props.theme.colors.black};
    `}  
  
  ${(props) =>
    props.variant === 'blackOnDark' &&
    `
        background-color: ${props.theme.colors.grey};
    `}
  
  ${(props) =>
    props.variant === 'link' &&
    `
        background-color: 'transparent';
    `}
  

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 60px;
  border-radius: 13px;

  ${(props) =>
    props.disabled &&
    `
    background-color: ${props.theme.colors.grey};
  `}

  ${(props) =>
    props.size === 'small' &&
    `
    height: 38px;
    padding-left: 12px;
    padding-right: 12px;
   `}
  
  ${(props) =>
    props.variant === 'link' &&
    `
    height: auto;
   `}
`

const TextStyled = styled(Text)<StyledElementsProps>`
  ${(props) =>
    props.variant === 'primary' &&
    `
        color: ${props.theme.colors.main};
    `}
  ${(props) =>
    props.variant === 'secondary' &&
    `
        color: ${props.theme.colors.darkBrown};
    `}
  ${(props) =>
    props.variant === 'black' &&
    `
        color: ${props.theme.colors.white};
    `}


  ${(props) =>
    props.variant === 'blackOnDark' &&
    `
        color: ${props.theme.colors.grayOnBlack};
    `}

  ${(props) =>
    props.variant === 'link' &&
    `
        color: ${props.theme.colors.white};
    `}

  font-size: 20px;
  font-weight: 600;
  line-height: 25px;
  font-family: '${(p) => p.theme.fonts.ttSatoshi600}';

  ${(props) =>
    props.size === 'small' &&
    `
    font-size: 16px;
   `}

  ${(props) =>
    props.disabled &&
    `
    color: #808080;
  `}
  
  ${(props) =>
    props.fontSize &&
    `
    font-size: ${props.fontSize}px;
  `}
`

const AfterIcon = styled(Image)`
  margin-left: 4px;
`

function Button({
  variant,
  text,
  onPress,
  disabled,
  style,
  size,
  fontSize,
  afterIcon,
}: Props): JSX.Element {
  const onPressInner = useCallback(() => {
    if (!disabled) onPress()
  }, [disabled, onPress])
  return (
    <PressableStyled
      onPress={onPressInner}
      variant={variant}
      style={style}
      size={size}
      disabled={!!disabled}
    >
      {text && (
        <TextStyled
          fontSize={fontSize}
          size={size}
          disabled={!!disabled}
          variant={variant}
        >
          {text}
        </TextStyled>
      )}
      {afterIcon && <AfterIcon source={afterIcon} />}
    </PressableStyled>
  )
}

export default Button
