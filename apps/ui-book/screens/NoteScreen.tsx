import {
  Avatar,
  avatarsSvg,
  Note,
  SizableText,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const testAvatarSource = require('../assets/testAvatar.png') as number

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const AnonymousAvatar = avatarsSvg[0]!

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

function PngAvatar(): React.JSX.Element {
  return <Avatar source={testAvatarSource} size="small" customSize={36} />
}

function SvgAvatar(): React.JSX.Element {
  return (
    <Avatar size="small" customSize={36}>
      <AnonymousAvatar size={36} />
    </Avatar>
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

        <SectionLabel>PNG avatar</SectionLabel>
        <Note
          avatar={<PngAvatar />}
          name="Direct friend"
          commonFriends="10 common friends"
          expiration="expires in 3 days"
          message="Looking for someone in Brno who's into crypto and coffee."
        />

        <SectionLabel>SVG anonymous avatar</SectionLabel>
        <Note
          avatar={<SvgAvatar />}
          name="Friend of friend"
          commonFriends="3 common friends"
          expiration="expires in 5 days"
          message="Selling 0.05 BTC for cash in Prague. DM me if interested!"
        />

        <SectionLabel>Pressable</SectionLabel>
        <Note
          avatar={<SvgAvatar />}
          name="Friend of friend"
          commonFriends="5 common friends"
          expiration="expires in 1 day"
          message="Looking to buy sats with Revolut. Quick and easy trade preferred."
          onPress={() => {}}
        />
      </YStack>
    </Theme>
  )
}

export function NoteScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Note
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
