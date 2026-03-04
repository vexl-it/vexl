import {
  Avatar,
  avatarsGoldenGlassesAndBackgroundSvg,
  avatarsSvg,
  SizableText,
  Theme,
  UserProfile,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const testAvatar = require('../assets/testAvatar.png') as number

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const BasicAvatar = avatarsSvg[0]!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GoldenAvatar = avatarsGoldenGlassesAndBackgroundSvg[0]!

function ThemedIcon({size}: {readonly size: number}): React.JSX.Element {
  const theme = useTheme()
  return <UserProfile size={size} color={theme.foregroundPrimary.val} />
}

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <SizableText
      fontFamily="$body"
      fontWeight="600"
      fontSize="$2"
      color="$foregroundSecondary"
      paddingTop="$3"
    >
      {children}
    </SizableText>
  )
}

function ThemedColumn({
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
        flex={1}
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SectionLabel>Sizes (with icon)</SectionLabel>
        <XStack gap="$3" alignItems="center">
          <Avatar size="small">
            <ThemedIcon size={16} />
          </Avatar>
          <Avatar size="medium">
            <ThemedIcon size={24} />
          </Avatar>
          <Avatar size="large">
            <ThemedIcon size={32} />
          </Avatar>
        </XStack>

        <SectionLabel>Grayscale</SectionLabel>
        <XStack gap="$3" alignItems="center">
          <Avatar size="small" grayscale>
            <ThemedIcon size={16} />
          </Avatar>
          <Avatar size="medium" grayscale>
            <ThemedIcon size={24} />
          </Avatar>
          <Avatar size="large" grayscale>
            <ThemedIcon size={32} />
          </Avatar>
        </XStack>

        <SectionLabel>Custom size (56px)</SectionLabel>
        <XStack gap="$3" alignItems="center">
          <Avatar customSize={56}>
            <ThemedIcon size={28} />
          </Avatar>
          <Avatar customSize={56} grayscale>
            <ThemedIcon size={28} />
          </Avatar>
        </XStack>

        <SectionLabel>With image</SectionLabel>
        <XStack gap="$3" alignItems="center">
          <Avatar size="medium" source={testAvatar} />
          <Avatar size="medium" source={testAvatar} grayscale />
        </XStack>

        <SectionLabel>With SVG avatar</SectionLabel>
        <XStack gap="$3" alignItems="center">
          <Avatar size="small">
            <BasicAvatar size={32} />
          </Avatar>
          <Avatar size="medium">
            <BasicAvatar size={48} />
          </Avatar>
          <Avatar size="large">
            <BasicAvatar size={64} />
          </Avatar>
        </XStack>

        <SectionLabel>With SVG avatar (grayscale)</SectionLabel>
        <XStack gap="$3" alignItems="center" flexWrap="wrap">
          <Avatar size="small">
            <BasicAvatar size={32} grayscale />
          </Avatar>
          <Avatar size="medium">
            <BasicAvatar size={48} grayscale />
          </Avatar>
          <Avatar size="large">
            <BasicAvatar size={64} grayscale />
          </Avatar>
          <Avatar size="medium">
            <GoldenAvatar size={48} grayscale />
          </Avatar>
        </XStack>

        <SectionLabel>Anonymous Avatars</SectionLabel>
        <XStack gap="$2" flexWrap="wrap">
          {avatarsSvg.map((AvatarComponent, i) => (
            <AvatarComponent key={i} size={48} />
          ))}
        </XStack>

        <SectionLabel>Golden Avatars</SectionLabel>
        <XStack gap="$2" flexWrap="wrap">
          {avatarsGoldenGlassesAndBackgroundSvg.map((AvatarComponent, i) => (
            <AvatarComponent key={i} size={48} />
          ))}
        </XStack>
      </YStack>
    </Theme>
  )
}

export function AvatarScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Avatar
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}
