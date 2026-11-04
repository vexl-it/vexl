import {styled} from 'tamagui'

import {YStack} from '../primitives'

export const PAGE_SECTION_MAX_WIDTH = 1200

/** Centered, width-limited column for web page sections. */
export const PageSection = styled(YStack, {
  name: 'PageSection',
  width: '100%',
  maxWidth: PAGE_SECTION_MAX_WIDTH,
  alignSelf: 'center',
  paddingHorizontal: '$5',
  paddingVertical: '$10',
  gap: '$7',

  $lg: {
    paddingHorizontal: '$9',
    paddingVertical: '$13',
  },
})
