import {Stack, styled} from 'tamagui'

const ComponentContainer = styled(Stack, {
  p: '$4',
  br: '$4',
  variants: {
    zeroValue: {
      true: {
        bc: '$grey',
      },
    },
    extremeValue: {
      true: {
        bc: '$redAccent1',
      },
      false: {
        bc: '$darkBrown',
      },
    },
  } as const,
})

export default ComponentContainer
