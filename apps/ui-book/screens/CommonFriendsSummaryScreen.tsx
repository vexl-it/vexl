import {
  CommonFriendsSummary,
  Theme,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

function ThemeDemo({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack
        gap="$5"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          {theme}
        </Typography>
        <YStack width={343} gap="$5" backgroundColor="$backgroundTertiary">
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
      </YStack>
    </Theme>
  )
}

export function CommonFriendsSummaryScreen(): React.JSX.Element {
  return (
    <ScrollView horizontal>
      <YStack padding="$5" gap="$5">
        <Typography variant="tabLargeBold" color="$foregroundPrimary">
          Common Friends Summary
        </Typography>
        <XStack gap="$3">
          <ThemeDemo theme="light" />
          <ThemeDemo theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}
