import type {CommonFriend} from '@vexl-next/ui'
import {CommonFriends, SizableText, Theme, YStack} from '@vexl-next/ui'
import React from 'react'
import {Alert, ScrollView} from 'react-native'

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

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Trusted first
        </SizableText>
        <CommonFriends
          label="5 common"
          trustedLabel="2 trusted"
          friends={[
            {
              id: 'jana',
              name: 'Jana Nováková',
              avatarSource: vexlAvatarSource,
              trusted: true,
            },
            {id: 'petr', name: 'Petr Svoboda', trusted: true},
            {id: 'lukas', name: 'Lukáš Dvořák'},
            {id: 'tereza', name: 'Tereza Malá'},
            {id: 'martin', name: 'Martin Kříž'},
          ]}
          trustedFriendsText="Jana Nováková and Petr Svoboda have you and the seller in their contacts."
          onPress={() => {
            Alert.alert('Trusted friends', 'Two trusted friends')
          }}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          One trusted friend
        </SizableText>
        <CommonFriends
          label="2 common"
          trustedLabel="1 trusted"
          friends={[
            {id: 'jana', name: 'Jana Nováková', trusted: true},
            {id: 'lukas', name: 'Lukáš Dvořák'},
          ]}
          trustedFriendsText="Jana Nováková has you and the seller in their contacts."
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Pressable
        </SizableText>
        <CommonFriends
          label="10 common friends"
          friends={SAMPLE_FRIENDS}
          onPress={() => {
            Alert.alert('Pressed', 'Common friends')
          }}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Few friends
        </SizableText>
        <CommonFriends
          label="2 common friends"
          friends={FEW_FRIENDS}
          onPress={() => {
            Alert.alert('Pressed', 'Few friends')
          }}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Without avatar (default placeholder)
        </SizableText>
        <CommonFriends
          label="5 common friends"
          friends={FRIENDS_WITHOUT_AVATAR}
          onPress={() => {
            Alert.alert('Pressed', 'Friends without avatar')
          }}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Not pressable
        </SizableText>
        <CommonFriends label="6 common friends" friends={SAMPLE_FRIENDS} />
      </YStack>
    </Theme>
  )
}

export function CommonFriendsScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Common Friends
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
