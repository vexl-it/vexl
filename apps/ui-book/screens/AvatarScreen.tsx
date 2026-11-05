import {
  Avatar,
  avatarsGoldenGlassesAndBackgroundSvg,
  avatarsSvg,
  UserImagePlaceholder,
  UserProfile,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const testAvatar = require('../assets/testAvatar.png') as number

const SAMPLE_SVG_XML =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#FCCD6C"/><circle cx="24" cy="20" r="9" fill="#EE675E"/><rect x="10" y="32" width="28" height="12" rx="6" fill="#455749"/></svg>'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const BasicAvatar = avatarsSvg[0]!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GoldenAvatar = avatarsGoldenGlassesAndBackgroundSvg[0]!

function ThemedIcon({
  size,
  onDark = false,
}: {
  readonly size: number
  readonly onDark?: boolean
}): React.JSX.Element {
  const theme = useTheme()
  return (
    <UserProfile
      size={size}
      color={onDark ? theme.white100.get() : theme.foregroundPrimary.get()}
    />
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <DemoSection title="Sizes (with icon)">
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
      </DemoSection>

      <DemoSection title="Grayscale">
        <XStack gap="$3" alignItems="center">
          <Avatar size="small" grayscale>
            <ThemedIcon size={16} onDark />
          </Avatar>
          <Avatar size="medium" grayscale>
            <ThemedIcon size={24} onDark />
          </Avatar>
          <Avatar size="large" grayscale>
            <ThemedIcon size={32} onDark />
          </Avatar>
        </XStack>
      </DemoSection>

      <DemoSection title="Token sizes ($9, $11, $13)">
        <XStack gap="$3" alignItems="center">
          <Avatar size="$9" source={testAvatar} />
          <Avatar size="$11" source={testAvatar} />
          <Avatar size="$13" source={testAvatar} />
        </XStack>
      </DemoSection>

      <DemoSection title="SVG string (svgXml)">
        <XStack gap="$3" alignItems="center">
          <Avatar size="medium" svgXml={SAMPLE_SVG_XML} />
          <Avatar size="medium" svgXml={SAMPLE_SVG_XML} grayscale />
        </XStack>
      </DemoSection>

      <DemoSection title="With image">
        <XStack gap="$3" alignItems="center">
          <Avatar size="medium" source={testAvatar} />
          <Avatar size="medium" source={testAvatar} grayscale />
        </XStack>
      </DemoSection>

      <DemoSection title="With SVG avatar">
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
      </DemoSection>

      <DemoSection title="With SVG avatar (grayscale)">
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
      </DemoSection>

      <DemoSection title="Placeholder (no image)">
        <XStack gap="$3" alignItems="center">
          <Avatar size="small">
            <UserImagePlaceholder size={32} />
          </Avatar>
          <Avatar size="medium">
            <UserImagePlaceholder size={48} />
          </Avatar>
          <Avatar size="large">
            <UserImagePlaceholder size={64} />
          </Avatar>
        </XStack>
      </DemoSection>

      <DemoSection title="Trusted">
        <YStack gap="$5">
          <XStack
            gap="$5"
            padding="$3"
            backgroundColor="$backgroundPrimary"
            alignItems="center"
          >
            <Avatar
              customSize={16}
              source={testAvatar}
              trusted
              trustBadgeRingColor="$backgroundPrimary"
            />
            <Avatar
              customSize={40}
              source={testAvatar}
              trusted
              trustBadgeRingColor="$backgroundPrimary"
            />
            <Avatar
              customSize={16}
              trusted
              trustBadgeRingColor="$backgroundPrimary"
            >
              <UserImagePlaceholder size={16} />
            </Avatar>
            <Avatar
              customSize={40}
              trusted
              trustBadgeRingColor="$backgroundPrimary"
            >
              <UserImagePlaceholder size={40} />
            </Avatar>
          </XStack>
          <XStack
            gap="$5"
            padding="$3"
            backgroundColor="$backgroundSecondary"
            alignItems="center"
          >
            <Avatar customSize={16} source={testAvatar} trusted />
            <Avatar customSize={40} source={testAvatar} grayscale trusted />
            <Avatar customSize={16} trusted>
              <UserImagePlaceholder size={16} />
            </Avatar>
            <Avatar customSize={40} grayscale trusted>
              <UserImagePlaceholder size={40} />
            </Avatar>
          </XStack>
        </YStack>
      </DemoSection>

      <DemoSection title="Anonymous Avatars">
        <XStack gap="$2" flexWrap="wrap">
          {avatarsSvg.map((AvatarComponent, i) => (
            <AvatarComponent key={i} size={48} />
          ))}
        </XStack>
      </DemoSection>

      <DemoSection title="Golden Avatars">
        <XStack gap="$2" flexWrap="wrap">
          {avatarsGoldenGlassesAndBackgroundSvg.map((AvatarComponent, i) => (
            <AvatarComponent key={i} size={48} />
          ))}
        </XStack>
      </DemoSection>
    </YStack>
  )
}

export function AvatarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Avatar" demos={Demos} />
}
