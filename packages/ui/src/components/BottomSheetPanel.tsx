import {styled} from 'tamagui'
import {YStack} from '../primitives'

export const BottomSheetPanel = styled(YStack, {
  name: 'BottomSheetPanel',
  padding: '$5',
  gap: '$4',
  backgroundColor: '$backgroundPrimary',
  borderTopLeftRadius: '$8',
  borderTopRightRadius: '$8',
})
