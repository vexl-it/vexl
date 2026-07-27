import {
  MarketplaceIntroDialogContent,
  Typography,
  VexlThemeProvider,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

function ThemeDemo({
  label,
  themeMode,
}: {
  readonly label: string
  readonly themeMode: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <VexlThemeProvider defaultMode={themeMode}>
      <YStack
        gap="$4"
        padding="$5"
        borderRadius="$5"
        backgroundColor="$backgroundPrimary"
      >
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          {label}
        </Typography>
        <MarketplaceIntroDialogContent description="Browse private peer-to-peer offers from people connected to your social network." />
      </YStack>
    </VexlThemeProvider>
  )
}

export function MarketplaceIntroDialogContentScreen(): React.JSX.Element {
  return (
    <ScrollView>
      <YStack padding="$5" gap="$5" backgroundColor="$backgroundPrimary">
        <Typography variant="tabLargeBold" color="$foregroundPrimary">
          Marketplace Intro Dialog Content
        </Typography>
        <ThemeDemo label="Light" themeMode="light" />
        <ThemeDemo label="Dark" themeMode="dark" />
      </YStack>
    </ScrollView>
  )
}
