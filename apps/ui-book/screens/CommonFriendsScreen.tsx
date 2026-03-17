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
