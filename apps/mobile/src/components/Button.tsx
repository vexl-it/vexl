import {Pressable, type StyleProp, Text, type ViewStyle} from 'react-native'
import styled from '@emotion/native'
import {useCallback} from 'react'

interface Props {
  onPress: () => void
  variant: 'primary' | 'secondary' | 'black'
  text: string
  style?: StyleProp<ViewStyle>

  disabled?: boolean
  size?: 'small' | 'normal'
}

interface StyledElementsProps {
  variant: 'primary' | 'secondary' | 'black'
  disabled: boolean
  size?: 'small' | 'normal'
}

const PressableStyled = styled(Pressable)<StyledElementsProps>`
  ${(props) =>
    props.variant === 'primary' &&
    `
        background-color: ${props.theme.colors.darkBrown};
    `}
  ${(props) =>
    props.variant === 'secondary' &&
    `
        background-color: ${props.theme.colors.main};;
    `}
  
  
  ${(props) =>
    props.variant === 'black' &&
    `
        background-color: ${props.theme.colors.black};;
    `}
  

  display: flex;
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
`

function Button({
  variant,
  text,
  onPress,
  disabled,
  style,
  size,
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
      <TextStyled size={size} disabled={!!disabled} variant={variant}>
        {text}
      </TextStyled>
    </PressableStyled>
  )
}

export default Button
