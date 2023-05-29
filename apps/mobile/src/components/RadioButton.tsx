import {Stack, styled} from 'tamagui'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'

const StyledRadioButton = styled(Stack, {
  w: 24,
  h: 24,
  ai: 'center',
  jc: 'center',
  bw: 2,
  br: 24,
  variants: {
    active: {
      true: {
        boc: '$main',
      },
      false: {
        boc: '$greyAccent3',
      },
    },
  },
})

const StyledCenter = styled(Stack, {
  w: 16,
  h: 16,
  br: 16,
  variants: {
    active: {
      true: {
        bc: '$main',
      },
      false: {
        bc: 'transparent',
      },
    },
  },
})

interface Props extends TouchableOpacityProps {
  active: boolean
}

function RadioButton({active, ...props}: Props): JSX.Element {
  return (
    <TouchableOpacity hitSlop={20} {...props}>
      <StyledRadioButton active={active}>
        <StyledCenter active={active} />
      </StyledRadioButton>
    </TouchableOpacity>
  )
}

export default RadioButton
