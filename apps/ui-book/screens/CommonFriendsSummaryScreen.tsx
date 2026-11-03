import {CommonFriendsSummary, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const PHONE_CONTENT_WIDTH = 343

function Demos(): React.JSX.Element {
  return (
    <YStack
      width="100%"
      maxWidth={PHONE_CONTENT_WIDTH}
      gap="$5"
      backgroundColor="$backgroundTertiary"
    >
      <CommonFriendsSummary commonFriends="3 common friends" />
      <CommonFriendsSummary
        commonFriends="5 common friends"
        trustedFriends="2 trusted"
      />
      <CommonFriendsSummary
        clubNames={['btc prague meetup']}
        commonFriends="1 common"
      />
      <CommonFriendsSummary
        clubNames={['btc prague meetup']}
        commonFriends="1 common"
        trustedFriends="1 trusted"
      />
      <CommonFriendsSummary
        clubNames={['btc prague meetup']}
        commonFriends="12 Gemeinsam"
        trustedFriends="3 vertraut"
      />
      <CommonFriendsSummary clubNames={['btc prague', 'satoshi club']} />
    </YStack>
  )
}

export function CommonFriendsSummaryScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Common Friends Summary" demos={Demos} />
}
