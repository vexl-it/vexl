import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {SandWatch} from '../icons/SandWatch'
import {XStack} from '../primitives'
import {CommonFriendsSummary} from './CommonFriendsSummary'
import {Typography} from './Typography'

export interface NoteMetaProps {
  readonly commonFriends?: string
  readonly trustedFriends?: string
  readonly expiration: string
}

const MetaFrame = styled(XStack, {
  name: 'NoteMeta',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: '$3',
  rowGap: '$1',
})

export function NoteMeta({
  commonFriends,
  trustedFriends,
  expiration,
}: NoteMetaProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <MetaFrame>
      <CommonFriendsSummary
        commonFriends={commonFriends}
        trustedFriends={trustedFriends}
      />
      <XStack gap="$1" alignItems="center" flexShrink={0}>
        <SandWatch
          size={getTokens().size.$5.val}
          color={theme.foregroundSecondary.get()}
        />
        <Typography variant="micro" color="$foregroundSecondary">
          {expiration}
        </Typography>
      </XStack>
    </MetaFrame>
  )
}
