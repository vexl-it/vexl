import React from 'react'
import type {ImageProps as RNImageProps} from 'react-native'
import {styled} from 'tamagui'

import {SizableText, XStack} from '../primitives'
import {Avatar} from './Avatar'

export interface ChipProps {
  readonly name: string
  readonly avatarSource?: RNImageProps['source']
}

const AVATAR_SIZE = 16

const ChipFrame = styled(XStack, {
  name: 'Chip',
  backgroundColor: '$backgroundTertiary',
  borderRadius: '$2',
  padding: '$2',
  gap: '$2',
  alignItems: 'center',
  alignSelf: 'flex-start',
  overflow: 'hidden',
  flexShrink: 0,
})

export function Chip({name, avatarSource}: ChipProps): React.JSX.Element {
  return (
    <ChipFrame>
      <Avatar source={avatarSource} customSize={AVATAR_SIZE} />
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
