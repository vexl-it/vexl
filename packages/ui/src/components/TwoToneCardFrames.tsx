import {styled} from 'tamagui'

import {YStack} from '../primitives'

export const TwoToneHeaderFrame = styled(YStack, {
  name: 'TwoToneHeaderFrame',
  backgroundColor: '$backgroundTertiary',
  padding: '$4',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
})

export const TwoToneContentFrame = styled(YStack, {
  name: 'TwoToneContentFrame',
  backgroundColor: '$backgroundSecondary',
  padding: '$4',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
})
