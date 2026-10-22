import {
  Avatar,
  Button,
  Dialog,
  TrustedFriendExplanation,
  Typography,
  UserImagePlaceholder,
  VexlThemeProvider,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

function Example({
  role,
  german = false,
}: {
  readonly role: string
  readonly german?: boolean
}): React.JSX.Element {
  return (
    <TrustedFriendExplanation
      you={{
        label: 'You',
        avatar: (
          <Avatar customSize={44}>
            <UserImagePlaceholder size={44} />
          </Avatar>
        ),
      }}
      trustedFriend={{
        label: 'Jana',
        avatar: {children: <UserImagePlaceholder size={44} />},
      }}
      otherSide={{
        label: role,
        avatar: (
          <Avatar customSize={44}>
            <UserImagePlaceholder size={44} />
          </Avatar>
        ),
      }}
      caption={
        german
          ? 'Du und die andere Person habt Jana beide in euren Kontakten gespeichert, und Jana hat euch ebenfalls beide in ihren Kontakten gespeichert.'
          : `You and the ${role.toLowerCase()} both have Jana in your contacts, and Jana has you both in theirs.`
      }
      commonFriendTitle="Common friend"
      commonFriendDescription={`You and the ${role.toLowerCase()} both have them in your contacts.`}
      trustedFriendTitle="Trusted friend"
      trustedFriendDescription="A common friend who also uses Vexl and has you both in their contacts."
      caution="Be cautious; we can't verify whether you really know each other in real life."
    />
  )
}

function ThemeDemo({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [visible, setVisible] = useState(false)
  return (
    <VexlThemeProvider defaultMode={theme}>
      <YStack
        width={343}
        padding="$5"
        gap="$5"
        borderRadius="$5"
        backgroundColor="$backgroundSecondary"
      >
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          {theme}
        </Typography>
        <Example role="Seller" />
        <Example role="Buyer" />
        <Example role="Other person" german />
        <Button
          onPress={() => {
            setVisible(true)
          }}
        >
          Open dialog
        </Button>
        <Dialog
          visible={visible}
          onClose={() => {
            setVisible(false)
          }}
          footer={
            <Button
              flex={1}
              onPress={() => {
                setVisible(false)
              }}
            >
              Got it
            </Button>
          }
        >
          <Typography variant="titlesSmall" color="$foregroundPrimary">
            What&apos;s a trusted friend?
          </Typography>
          <Example role="Seller" />
        </Dialog>
      </YStack>
    </VexlThemeProvider>
  )
}

export function TrustedFriendExplanationScreen(): React.JSX.Element {
  return (
    <ScrollView horizontal>
      <ScrollView>
        <YStack padding="$5" gap="$5">
          <Typography variant="tabLargeBold" color="$foregroundPrimary">
            Trusted Friend Explanation
          </Typography>
          <XStack gap="$3">
            <ThemeDemo theme="light" />
            <ThemeDemo theme="dark" />
          </XStack>
        </YStack>
      </ScrollView>
    </ScrollView>
  )
}
