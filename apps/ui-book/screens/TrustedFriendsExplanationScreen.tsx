import {
  Avatar,
  avatarsSvg,
  SizableText,
  Theme,
  TrustedFriendsExplanation,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'
import {ScrollView} from 'react-native'
import {getTokens} from 'tamagui'

function AnonymousAvatar({index}: {readonly index: number}): React.JSX.Element {
  const AvatarGraphic = avatarsSvg[index]
  const size = getTokens().size.$9.val + getTokens().size.$2.val

  return (
    <Avatar customSize={size}>
      {AvatarGraphic ? <AvatarGraphic size={size} /> : null}
    </Avatar>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      {pipe(
        ['Seller', 'Buyer', 'Other person'],
        Array.map((role) => {
          const person = role.toLowerCase()

          return (
            <YStack
              key={role}
              gap="$4"
              padding="$5"
              borderRadius="$5"
              backgroundColor="$backgroundSecondary"
            >
              <Typography variant="descriptionBold" color="$foregroundPrimary">
                {role}
              </Typography>
              <TrustedFriendsExplanation
                you={{avatar: <AnonymousAvatar index={6} />, label: 'You'}}
                trustedFriend={{
                  avatar: <AnonymousAvatar index={2} />,
                  label: 'Jana Nováková',
                }}
                otherPerson={{
                  avatar: <AnonymousAvatar index={0} />,
                  label: role,
                }}
                caption={`You and the ${person} have Jana Nováková in your contacts, and Jana Nováková has you and the ${person} in theirs.`}
                commonFriendComparison={{
                  title: 'Common friend',
                  description: `You and the ${person} both have them in your contacts.`,
                }}
                trustedFriendComparison={{
                  title: 'Trusted friend',
                  description: `They use Vexl too and have you and the ${person} in their contacts.`,
                }}
                caution="Be cautious; we can't verify whether you really know each other in real life."
              />
            </YStack>
          )
        })
      )}
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

export function TrustedFriendsExplanationScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Trusted Friends Explanation
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
