import {
  Paragraph,
  Separator,
  SizableText,
  Stack,
  useVexlTheme,
  VexlThemeProvider,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {StatusBar} from 'expo-status-bar'
import React from 'react'
import {Button} from 'tamagui'

function ThemeToggleDemo(): React.JSX.Element {
  const {mode, resolvedTheme, toggle, setMode} = useVexlTheme()

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="$backgroundPrimary"
      padding="$6"
      gap="$4"
    >
      <SizableText fontFamily="$heading" fontSize="$6" fontWeight="400">
        Vexl UI Preview
      </SizableText>

      <Paragraph color="$foregroundSecondary">
        Current mode: {mode} (resolved: {resolvedTheme})
      </Paragraph>

      <Separator />

      <XStack gap="$3">
        <Button onPress={toggle}>Toggle Theme</Button>
        <Button
          onPress={() => {
            setMode('system')
          }}
        >
          System
        </Button>
      </XStack>

      <YStack gap="$3" width="100%" paddingTop="$4">
        <Stack
          backgroundColor="$accentYellowPrimary"
          padding="$5"
          borderRadius="$4"
          alignItems="center"
        >
          <Paragraph color="$foregroundPrimary">Accent Yellow</Paragraph>
        </Stack>

        <Stack
          backgroundColor="$greenBackground"
          padding="$5"
          borderRadius="$4"
          alignItems="center"
        >
          <Paragraph color="$greenForeground">Green</Paragraph>
        </Stack>

        <Stack
          backgroundColor="$redBackground"
          padding="$5"
          borderRadius="$4"
          alignItems="center"
        >
          <Paragraph color="$redForeground">Red</Paragraph>
        </Stack>

        <Stack
          backgroundColor="$pinkBackground"
          padding="$5"
          borderRadius="$4"
          alignItems="center"
        >
          <Paragraph color="$pinkForeground">Pink</Paragraph>
        </Stack>
      </YStack>

      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </YStack>
  )
}

export default function App(): React.JSX.Element {
  return (
    <VexlThemeProvider>
      <ThemeToggleDemo />
    </VexlThemeProvider>
  )
}
