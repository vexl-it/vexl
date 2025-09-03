import React from 'react'
import {ScrollView} from 'react-native'
import {Stack, styled} from 'tamagui'

const WhiteContainer = styled(Stack, {
  f: 1,
  br: '$5',
  p: '$5',
  bg: '$white',
  variants: {
    noPadding: {
      true: {
        p: '$0',
      },
    },
  } as const,
})

export default WhiteContainer

export function WhiteContainerWithScroll({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <WhiteContainer noPadding>
      <ScrollView>
        <Stack p="$5">{children}</Stack>
      </ScrollView>
    </WhiteContainer>
  )
}
