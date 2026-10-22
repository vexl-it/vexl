import {NoteMeta, Theme, Typography, XStack, YStack} from '@vexl-next/ui'
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
        <YStack width={280} gap="$5" backgroundColor="$backgroundTertiary">
          <NoteMeta expiration="Expires in 23 hours" />
          <NoteMeta
            commonFriends="3 common friends"
            expiration="Expires in 23 hours"
          />
          <NoteMeta
            commonFriends="3 common friends"
            trustedFriends="1 trusted"
            expiration="Expires in 7 days"
          />
          <NoteMeta
            commonFriends="12 gemeinsame Freunde"
            trustedFriends="3 vertraut"
            expiration="Läuft in 7 Tagen ab"
          />
        </YStack>
      </YStack>
    </Theme>
  )
}

export function NoteMetaScreen(): React.JSX.Element {
  return (
    <ScrollView horizontal>
      <YStack padding="$5" gap="$5">
        <Typography variant="tabLargeBold" color="$foregroundPrimary">
          Note Meta
        </Typography>
        <XStack gap="$3">
          <ThemeDemo theme="light" />
          <ThemeDemo theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}
