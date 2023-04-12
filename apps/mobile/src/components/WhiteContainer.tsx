import {Stack, styled} from 'tamagui'

const WhiteContainer = styled(Stack, {
  f: 1,
  br: '$5',
  bg: '$white',
  variants: {
    noPadding: {
      true: {
        p: '$0',
      },
      false: {
        p: '$5',
      },
    },
  } as const,
})

export default WhiteContainer
