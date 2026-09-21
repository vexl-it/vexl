import {
  CardButton,
  OffersReencryptionStatus,
  Theme,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

function ThemedPreview({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [startedAt, setStartedAt] = useState<number | null>(
    () => Date.now() - 1000
  )

  return (
    <Theme name={theme}>
      <YStack f={1} gap="$4" py="$5" br="$5" bg="$backgroundPrimary">
        <Typography px="$5" variant="titlesSmall" color="$foregroundPrimary">
          {theme === 'light' ? 'Light' : 'Dark'}
        </Typography>
        <OffersReencryptionStatus
          startedAt={startedAt}
          label="Encrypting offers for new connections…"
        />
        <YStack px="$5" gap="$3">
          <Typography variant="description" color="$foregroundSecondary">
            Appears after one second. Finishing hides it immediately.
          </Typography>
          <CardButton
            onPress={() => {
              setStartedAt(Date.now())
            }}
          >
            Start / restart
          </CardButton>
          <CardButton
            type="text"
            onPress={() => {
              setStartedAt(null)
            }}
          >
            Finish
          </CardButton>
        </YStack>
      </YStack>
    </Theme>
  )
}

export function OffersReencryptionStatusScreen(): React.JSX.Element {
  return (
    <ScrollView>
      <YStack p="$5" gap="$5">
        <Typography variant="tabLargeBold" color="$foregroundPrimary">
          Offers Reencryption Status
        </Typography>
        <XStack gap="$3" ai="flex-start">
          <ThemedPreview theme="light" />
          <ThemedPreview theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}
