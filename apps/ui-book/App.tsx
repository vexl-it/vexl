import {
  SizableText,
  Stack,
  useVexlTheme,
  vexlFonts,
  VexlThemeProvider,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useFonts} from 'expo-font'
import {StatusBar} from 'expo-status-bar'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

import {screens} from './screens'

function ScreenNav(): React.JSX.Element {
  const {resolvedTheme, toggle} = useVexlTheme()
  const [activeScreen, setActiveScreen] = useState<number | null>(null)

  if (activeScreen !== null) {
    const entry = screens[activeScreen]
    if (entry) {
      const Screen = entry.component
      return (
        <YStack flex={1} backgroundColor="$backgroundPrimary">
          <XStack
            paddingTop="$12"
            paddingHorizontal="$5"
            paddingBottom="$4"
            backgroundColor="$backgroundSecondary"
            alignItems="center"
            gap="$3"
          >
            <Stack
              onPress={() => {
                setActiveScreen(null)
              }}
              paddingVertical="$2"
              paddingHorizontal="$3"
              backgroundColor="$backgroundTertiary"
              borderRadius="$2.5"
            >
              <SizableText
                fontFamily="$body"
                fontWeight="600"
                fontSize={14}
                color="$foregroundPrimary"
              >
                Back
              </SizableText>
            </Stack>
            <SizableText
              fontFamily="$heading"
              fontWeight="700"
              fontSize={18}
              color="$foregroundPrimary"
            >
              {entry.label}
            </SizableText>
          </XStack>
          <Screen />
          <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
        </YStack>
      )
    }
  }

  return (
    <YStack flex={1} backgroundColor="$backgroundPrimary">
      <YStack
        paddingTop="$13"
        paddingHorizontal="$5"
        paddingBottom="$5"
        backgroundColor="$backgroundSecondary"
        gap="$2"
      >
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize={28}
          color="$foregroundPrimary"
        >
          Vexl UI
        </SizableText>
        <Stack
          onPress={toggle}
          alignSelf="flex-start"
          paddingVertical="$2"
          paddingHorizontal="$3"
          backgroundColor="$backgroundTertiary"
          borderRadius="$2.5"
        >
          <SizableText
            fontFamily="$body"
            fontWeight="500"
            fontSize={14}
            color="$foregroundSecondary"
          >
            Toggle theme ({resolvedTheme})
          </SizableText>
        </Stack>
      </YStack>

      <ScrollView style={{flex: 1}}>
        <YStack padding="$5" gap="$3">
          {screens.map((entry, i) => (
            <Stack
              key={entry.label}
              onPress={() => {
                setActiveScreen(i)
              }}
              backgroundColor="$backgroundSecondary"
              paddingVertical="$5"
              paddingHorizontal="$5"
              borderRadius="$4"
            >
              <SizableText
                fontFamily="$body"
                fontWeight="600"
                fontSize={16}
                color="$foregroundPrimary"
              >
                {entry.label}
              </SizableText>
            </Stack>
          ))}
        </YStack>
      </ScrollView>

      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </YStack>
  )
}

export default function App(): React.JSX.Element {
  const [fontsLoaded] = useFonts(vexlFonts)

  if (!fontsLoaded) {
    return <></>
  }

  return (
    <VexlThemeProvider>
      <ScreenNav />
    </VexlThemeProvider>
  )
}
