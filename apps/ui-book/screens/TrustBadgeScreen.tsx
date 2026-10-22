import {
  Stack,
  Theme,
  TrustBadge,
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
        flex={1}
        gap="$5"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          {theme}
        </Typography>
        <XStack gap="$4" alignItems="center">
          <TrustBadge size="small" />
          <TrustBadge size="medium" />
          <TrustBadge size="large" />
          <TrustBadge size="xlarge" />
        </XStack>
        <Stack
          backgroundColor="$backgroundSecondary"
          padding="$5"
          borderRadius="$4"
        >
          <XStack gap="$5" alignItems="center">
            <TrustBadge size="small" ringColor="$backgroundSecondary" />
            <TrustBadge size="large" ringColor="$backgroundSecondary" />
          </XStack>
        </Stack>
        <Stack
          backgroundColor="$backgroundTertiary"
          padding="$5"
          borderRadius="$4"
        >
          <XStack gap="$5" alignItems="center">
            <TrustBadge size="small" ringColor="$backgroundTertiary" />
            <TrustBadge size="large" ringColor="$backgroundTertiary" />
          </XStack>
        </Stack>
        <Stack
          backgroundColor="$accentYellowSecondary"
          padding="$5"
          borderRadius="$4"
        >
          <XStack gap="$5" alignItems="center">
            <TrustBadge size="small" ringColor="$accentYellowSecondary" />
            <TrustBadge size="large" ringColor="$accentYellowSecondary" />
          </XStack>
        </Stack>
      </YStack>
    </Theme>
  )
}

export function TrustBadgeScreen(): React.JSX.Element {
  return (
    <ScrollView>
      <YStack padding="$5" gap="$5">
        <Typography variant="tabLargeBold" color="$foregroundPrimary">
          Trust Badge
        </Typography>
        <XStack gap="$3">
          <ThemeDemo theme="light" />
          <ThemeDemo theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}
