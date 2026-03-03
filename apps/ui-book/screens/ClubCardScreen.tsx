import {
  Avatar,
  ClubCard,
  SizableText,
  TextTag,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const clubTestAvatar = require('../assets/clubTestAvatar.png') as number

const avatar = <Avatar size="medium" source={clubTestAvatar} />

function Section({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack gap="$3">
      <SizableText
        fontFamily="$body"
        fontWeight="600"
        fontSize="$5"
        letterSpacing="$5"
        color="$foregroundPrimary"
      >
        {title}
      </SizableText>
      {children}
    </YStack>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <ClubCard
        avatar={avatar}
        name="btc prague 2025"
        subtitle="10 common friends"
      />
      <ClubCard
        avatar={avatar}
        name="btc prague 2025"
        subtitle="10 common friends"
        tag={<TextTag variant="outdated" label="Expired" />}
      />
      <ClubCard
        avatar={avatar}
        name="btc prague 2025"
        subtitle="10 common friends"
        onPress={() => {}}
      />
    </YStack>
  )
}

export function ClubCardScreen(): React.JSX.Element {
  return (
    <ScrollView>
      <YStack
        flex={1}
        padding="$5"
        gap="$7"
        backgroundColor="$backgroundPrimary"
      >
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          letterSpacing="$3"
          color="$foregroundPrimary"
        >
          ClubCard
        </SizableText>

        <Section title="Light">
          <Demos />
        </Section>

        <Section title="Dark">
          <Theme name="dark">
            <YStack
              gap="$3"
              padding="$5"
              borderRadius="$5"
              backgroundColor="$backgroundPrimary"
            >
              <Demos />
            </YStack>
          </Theme>
        </Section>
      </YStack>
    </ScrollView>
  )
}
