import React from 'react'
import {styled} from 'tamagui'

import {SizableText, Stack, XStack} from '../primitives'

export interface ChipProps {
  readonly name: string
  readonly avatar: React.ReactNode
}

const ChipFrame = styled(XStack, {
  name: 'Chip',
  backgroundColor: '$backgroundTertiary',
  borderRadius: '$2',
  padding: '$2',
  gap: '$2',
  alignItems: 'center',
  overflow: 'hidden',
  flexShrink: 0,
})

export function Chip({name, avatar}: ChipProps): React.JSX.Element {
  return (
    <ChipFrame>
      <Stack width="$5" height="$5" borderRadius="$2" overflow="hidden">
        {avatar}
      </Stack>
      <SizableText
        fontFamily="$body"
        fontWeight="500"
        fontSize="$1"
        letterSpacing="$1"
        lineHeight="$1"
        color="$foregroundSecondary"
        numberOfLines={1}
      >
        {name}
      </SizableText>
    </ChipFrame>
  )
}
