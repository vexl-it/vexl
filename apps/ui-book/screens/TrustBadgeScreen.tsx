import {
  Avatar,
  SizableText,
  Theme,
  TrustBadge,
  Typography,
  UserImagePlaceholder,
  XStack,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'
import {ScrollView} from 'react-native'
import {getTokens} from 'tamagui'

function Demos(): React.JSX.Element {
  const theme = useTheme()
  const sizes = getTokens().size

  return (
    <YStack gap="$5">
      <Typography variant="descriptionBold" color="$foregroundPrimary">
        Inline sizes
      </Typography>
      <XStack gap="$5" alignItems="center">
        {pipe(
          [10, 14, 16, 20],
          Array.map((size) => (
            <YStack key={size} gap="$3" alignItems="center">
              <TrustBadge size={size} accessibilityLabel="Trusted friend" />
              <Typography variant="micro" color="$foregroundSecondary">
                {size}
              </Typography>
            </YStack>
          ))
        )}
      </XStack>
      <Typography variant="descriptionBold" color="$foregroundPrimary">
        Avatar overlays
      </Typography>
      <XStack
        gap="$5"
        padding="$5"
        alignItems="center"
        backgroundColor="$backgroundSecondary"
        borderRadius="$4"
      >
        <YStack position="relative">
          <Avatar customSize={sizes.$5.val}>
            <UserImagePlaceholder size={sizes.$5.val} />
          </Avatar>
          <TrustBadge
            variant="overlay"
            size={10}
            ringColor={theme.backgroundSecondary.get()}
          />
        </YStack>
        <YStack position="relative">
          <Avatar size="$9">
            <UserImagePlaceholder size={sizes.$9.val} />
          </Avatar>
          <TrustBadge
            variant="overlay"
            ringColor={theme.backgroundSecondary.get()}
          />
        </YStack>
      </XStack>
      <XStack
        gap="$5"
        padding="$5"
        alignItems="center"
        backgroundColor="$accentYellowSecondary"
        borderRadius="$4"
      >
        <YStack position="relative">
          <Avatar customSize={sizes.$5.val}>
            <UserImagePlaceholder size={sizes.$5.val} />
          </Avatar>
          <TrustBadge
            variant="overlay"
            size={10}
            ringColor={theme.accentYellowSecondary.get()}
          />
        </YStack>
        <YStack position="relative">
          <Avatar size="$9">
            <UserImagePlaceholder size={sizes.$9.val} />
          </Avatar>
          <TrustBadge
            variant="overlay"
            ringColor={theme.accentYellowSecondary.get()}
          />
        </YStack>
      </XStack>
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

export function TrustBadgeScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Trust Badge
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
