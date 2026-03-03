import type {CommonFriend} from '@vexl-next/ui'
import {Avatar, CommonFriends, SizableText, Theme, YStack} from '@vexl-next/ui'
import React from 'react'
import {Alert, ScrollView} from 'react-native'

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const vexlAvatarSource = require('../assets/vexlAvatar.png') as number

function FriendAvatar(): React.JSX.Element {
  return <Avatar source={vexlAvatarSource} size="small" customSize={16} />
}

const SAMPLE_FRIENDS: readonly CommonFriend[] = [
  {name: 'Marcel Mrkev', avatar: <FriendAvatar />},
  {name: 'Stepan', avatar: <FriendAvatar />},
  {name: 'Grafon', avatar: <FriendAvatar />},
  {name: 'Alice', avatar: <FriendAvatar />},
  {name: 'Bob', avatar: <FriendAvatar />},
  {name: 'Charlie', avatar: <FriendAvatar />},
]

const FEW_FRIENDS: readonly CommonFriend[] = [
  {name: 'Marcel', avatar: <FriendAvatar />},
  {name: 'Stepan', avatar: <FriendAvatar />},
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
