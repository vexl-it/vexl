import React from 'react'
import {getTokens, styled} from 'tamagui'

import {XStack, YStack} from '../primitives'
import {Chip} from './Chip'
import {type CommonFriend} from './CommonFriends'
import {TrustBadge} from './TrustBadge'
import {Typography} from './Typography'

export interface TrustedFriendsBoxProps {
  readonly heading: string
  readonly friends: readonly CommonFriend[]
  readonly text: string
}

const TrustedFriendsBoxFrame = styled(YStack, {
  name: 'TrustedFriendsBox',
  backgroundColor: '$backgroundTertiary',
  borderRadius: '$4',
  padding: '$4',
  gap: '$3',
})

export function TrustedFriendsBox({
  heading,
  friends,
  text,
}: TrustedFriendsBoxProps): React.JSX.Element {
  return (
    <TrustedFriendsBoxFrame>
      <XStack gap="$3" alignItems="center">
        <TrustBadge size={getTokens().size.$5.val} />
        <Typography
          variant="descriptionBold"
          color="$foregroundPrimary"
          flex={1}
        >
          {heading}
        </Typography>
      </XStack>
      <XStack gap="$3" flexWrap="wrap">
        {friends.map((friend) => (
          <Chip
            key={friend.id}
            name={friend.name}
            avatarSource={friend.avatarSource}
            trusted
          />
        ))}
      </XStack>
      <Typography variant="micro" color="$foregroundPrimary">
        {text}
      </Typography>
    </TrustedFriendsBoxFrame>
  )
}
