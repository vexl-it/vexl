import {styled, Text} from 'tamagui'

const SliderText = styled(Text, {
  fos: 16,
  variants: {
    zeroValue: {
      true: {
        col: '$greyOnBlack',
      },
    },
    extremeValue: {
      true: {
        col: '$red',
      },
      false: {
        col: '$main',
      },
    },
  } as const,
})

export default SliderText
