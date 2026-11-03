import React from 'react'
import {styled, withStaticProperties} from 'tamagui'

import {YStack} from '../primitives'

const TwoToneCardFrame = styled(YStack, {
  name: 'TwoToneCard',
  gap: '$0.5',

  variants: {
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
        },
      },
    },
  } as const,
})

const TwoToneCardHeader = styled(YStack, {
  name: 'TwoToneCardHeader',
  backgroundColor: '$backgroundTertiary',
  padding: '$4',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
})

const TwoToneCardContent = styled(YStack, {
  name: 'TwoToneCardContent',
  backgroundColor: '$backgroundSecondary',
  padding: '$4',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
  overflow: 'hidden',
})

export type TwoToneCardProps = Omit<
  React.ComponentProps<typeof TwoToneCardFrame>,
  'pressable'
>

function TwoToneCardRoot(props: TwoToneCardProps): React.JSX.Element {
  return <TwoToneCardFrame pressable={!!props.onPress} {...props} />
}

export const TwoToneCard = withStaticProperties(TwoToneCardRoot, {
  Header: TwoToneCardHeader,
  Content: TwoToneCardContent,
})
