import type {CommonFriend} from '@vexl-next/ui'
import {CommonFriends, YStack} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const vexlAvatarSource = require('../assets/vexlAvatar.png') as number

const SAMPLE_FRIENDS: readonly CommonFriend[] = [
  {id: '1', name: 'Marcel Mrkev', avatarSource: vexlAvatarSource},
  {id: '2', name: 'Stepan', avatarSource: vexlAvatarSource},
  {id: '3', name: 'Grafon', avatarSource: vexlAvatarSource},
  {id: '4', name: 'Alice', avatarSource: vexlAvatarSource},
  {id: '5', name: 'Bob', avatarSource: vexlAvatarSource},
  {id: '6', name: 'Charlie', avatarSource: vexlAvatarSource},
]

const FEW_FRIENDS: readonly CommonFriend[] = [
  {id: '1', name: 'Marcel', avatarSource: vexlAvatarSource},
  {id: '2', name: 'Stepan', avatarSource: vexlAvatarSource},
]

const FRIENDS_WITHOUT_AVATAR: readonly CommonFriend[] = [
  {id: '1', name: 'Anonymous'},
  {id: '2', name: 'Marcel', avatarSource: vexlAvatarSource},
  {id: '3', name: 'Unknown'},
  {id: '4', name: 'Grafon', avatarSource: vexlAvatarSource},
  {id: '5', name: 'No image'},
]

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <DemoSection title="Pressable">
        <CommonFriends
          label="10 common friends"
          friends={SAMPLE_FRIENDS}
          onPress={() => {
            Alert.alert('Pressed', 'Common friends')
          }}
        />
      </DemoSection>

      <DemoSection title="Few friends">
        <CommonFriends
          label="2 common friends"
          friends={FEW_FRIENDS}
          onPress={() => {
            Alert.alert('Pressed', 'Few friends')
          }}
        />
      </DemoSection>

      <DemoSection title="Without avatar (default placeholder)">
        <CommonFriends
          label="5 common friends"
          friends={FRIENDS_WITHOUT_AVATAR}
          onPress={() => {
            Alert.alert('Pressed', 'Friends without avatar')
          }}
        />
      </DemoSection>

      <DemoSection title="Trusted">
        <CommonFriends
          label="5 common"
          trustedLabel="2 trusted"
          friends={[
            {
              id: 'trusted-jana',
              name: 'Jana',
              avatarSource: vexlAvatarSource,
              trusted: true,
            },
            {id: 'trusted-petr', name: 'Petr', trusted: true},
            ...FEW_FRIENDS,
          ]}
        />
      </DemoSection>
      <DemoSection title="Trusted + club">
        <CommonFriends
          label="5 common and 1 clubs"
          trustedLabel="2 trusted"
          friends={[
            {
              id: 'trusted-jana',
              name: 'Jana',
              avatarSource: vexlAvatarSource,
              trusted: true,
            },
            {id: 'trusted-petr', name: 'Petr', trusted: true},
            ...FEW_FRIENDS,
            {id: 'club', name: 'btc prague', avatarSource: vexlAvatarSource},
          ]}
        />
      </DemoSection>

      <DemoSection title="Not pressable">
        <CommonFriends label="6 common friends" friends={SAMPLE_FRIENDS} />
      </DemoSection>
    </YStack>
  )
}

export function CommonFriendsScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Common Friends" demos={Demos} />
}
