import {TextInput as RNTextInput, type TextInputProps} from 'react-native'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import Image from './Image'
import {Stack, XStack, styled} from 'tamagui'

interface StylingProps {
  small?: boolean
}

const RootContainer = styled(XStack, {
  ai: 'center',
  bg: '$greyAccent5',
  p: '$4',
  br: '$4',
  mx: '$-4',
  variants: {
    small: {
      true: {
        p: '$2',
      },
    },
  },
})

const InputStyled = styled(RNTextInput, {
  f: 1,
  fos: 18,
  ff: '$body500',
  placeholderTextColor: '#848484',
  variants: {
    small: {
      true: {
        fos: 16,
      },
    },
  },
})

export interface Props extends TextInputProps, Pick<StylingProps, 'small'> {
  icon?: SvgString
}

function TextInput(props: Props): JSX.Element {
  const {style, small, icon, ...restProps} = props
  return (
    <RootContainer small={small} style={style}>
      {icon && (
        <Stack mr="$2">
          <Image source={icon} />
        </Stack>
      )}
      <InputStyled small={small} {...restProps} />
    </RootContainer>
  )
}

export default TextInput
