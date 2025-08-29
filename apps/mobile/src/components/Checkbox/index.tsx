import React from 'react'
import {
  TouchableWithoutFeedback,
  type TouchableWithoutFeedbackProps,
} from 'react-native'
import {Stack, styled} from 'tamagui'
import Image from '../Image'
import checkedSvg from './image/checkedSvg'
import uncheckedSvg from './image/uncheckedSvg'

interface Props extends TouchableWithoutFeedbackProps {
  value: boolean
  onChange: (value: boolean) => void
  size?: 'small' | 'large' | '24x24'
}

const StackStyled = styled(Stack, {
  variants: {
    size: {
      small: {
        width: 16,
        height: 16,
      },
      large: {
        width: 32,
        height: 32,
      },
      '24x24': {
        width: 24,
        height: 24,
      },
    },
  },
})

function Checkbox({
  value,
  onChange,
  size = 'large',
  ...props
}: Props): React.ReactElement {
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        onChange(!value)
      }}
      {...props}
    >
      <StackStyled size={size}>
        <Image source={value ? checkedSvg : uncheckedSvg} />
      </StackStyled>
    </TouchableWithoutFeedback>
  )
}

export default Checkbox
