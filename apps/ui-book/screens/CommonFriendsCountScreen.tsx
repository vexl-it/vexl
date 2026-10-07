import {
  CommonFriendsCount,
  SizableText,
  Theme,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'
import {getTokens} from 'tamagui'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <Typography variant="descriptionBold" color="$foregroundPrimary">
        Common only
      </Typography>
      <CommonFriendsCount commonFriends="5 common friends" />
      <Typography variant="descriptionBold" color="$foregroundPrimary">
        Common and trusted
      </Typography>
      <CommonFriendsCount
        commonFriends="5 common friends"
        trustedFriends="2 trusted"
      />
      <Typography variant="descriptionBold" color="$foregroundPrimary">
        Trusted count wraps
      </Typography>
      <YStack width={getTokens().size.$9.val * 5}>
        <CommonFriendsCount
          commonFriends="5 gemeinsame Freunde"
          trustedFriends="2 vertrauenswürdig"
        />
      </YStack>
      <Typography variant="descriptionBold" color="$foregroundPrimary">
        Club truncates first
      </Typography>
      <CommonFriendsCount
        clubLabels={['A very long Prague Bitcoin community club name']}
        commonFriends="5 common friends"
        trustedFriends="2 trusted"
      />
      <Typography variant="descriptionBold" color="$foregroundPrimary">
        Clubs only
      </Typography>
      <CommonFriendsCount clubLabels={['BTC Prague', 'Bitcoin Brno']} />
    </YStack>
  )
}

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack
        width={getTokens().size.$13.val * 5 + getTokens().size.$9.val}
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
        <Demos />
      </YStack>
    </Theme>
  )
}

export function CommonFriendsCountScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Common Friends Count
        </SizableText>
        <ScrollView horizontal>
          <XStack gap="$4" alignItems="flex-start">
            <ThemeGroup theme="light" />
            <ThemeGroup theme="dark" />
          </XStack>
        </ScrollView>
      </YStack>
    </ScrollView>
  )
}
