import {
  SearchBar,
  SizableText,
  Stack,
  Toast,
  useVexlTheme,
  vexlFonts,
  VexlThemeProvider,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useFonts} from 'expo-font'
import {atom} from 'jotai'

import {StatusBar} from 'expo-status-bar'
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {toastAtom} from './state/toastAtom'

import {screens, type ScreenEntry} from './screens'

function ScreenNav(): React.JSX.Element {
  const {resolvedTheme, toggle} = useVexlTheme()
  const [activeScreen, setActiveScreen] = useState<ScreenEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const catalogScrollViewRef = useRef<ScrollView | null>(null)
  const catalogScrollOffsetRef = useRef(0)
  const shouldRestoreCatalogScrollRef = useRef(false)

  const searchAtom = useMemo(
    () =>
      atom(
        () => searchQuery,
        (_get, _set, update: React.SetStateAction<string>) => {
          setSearchQuery((previousValue) =>
            typeof update === 'function' ? update(previousValue) : update
          )
        }
      ),
    [searchQuery]
  )

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredScreens = useMemo(
    () =>
      screens.filter((entry) =>
        entry.label.toLowerCase().includes(normalizedSearchQuery)
      ),
    [normalizedSearchQuery]
  )

  useEffect(() => {
    if (!shouldRestoreCatalogScrollRef.current || activeScreen !== null) return

    const restoreScrollTimeout = setTimeout(() => {
      catalogScrollViewRef.current?.scrollTo({
        animated: false,
        y: catalogScrollOffsetRef.current,
      })
      shouldRestoreCatalogScrollRef.current = false
    }, 0)

    return () => {
      clearTimeout(restoreScrollTimeout)
    }
  }, [activeScreen])

  const handleCatalogScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    catalogScrollOffsetRef.current = event.nativeEvent.contentOffset.y
  }

  if (activeScreen !== null) {
    const Screen = activeScreen.component
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
              shouldRestoreCatalogScrollRef.current = true
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
            {activeScreen.label}
          </SizableText>
        </XStack>
        <Screen />
        <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      </YStack>
    )
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
        <SearchBar
          valueAtom={searchAtom}
          placeholder="Search components"
          autoFocus={false}
        />
      </YStack>

      <ScrollView
        ref={catalogScrollViewRef}
        style={{flex: 1}}
        onScroll={handleCatalogScroll}
        scrollEventThrottle={16}
      >
        <YStack padding="$5" gap="$3">
          {filteredScreens.map((entry) => (
            <Stack
              key={entry.label}
              onPress={() => {
                setActiveScreen(entry)
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
          {filteredScreens.length === 0 ? (
            <YStack
              backgroundColor="$backgroundSecondary"
              paddingVertical="$6"
              paddingHorizontal="$5"
              borderRadius="$4"
            >
              <SizableText
                fontFamily="$body"
                fontWeight="600"
                fontSize={16}
                color="$foregroundPrimary"
              >
                No components found
              </SizableText>
              <SizableText
                fontFamily="$body"
                fontWeight="500"
                fontSize={14}
                color="$foregroundSecondary"
              >
                Try a different search term.
              </SizableText>
            </YStack>
          ) : null}
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
    <SafeAreaProvider>
      <GestureHandlerRootView style={{flex: 1}}>
        <VexlThemeProvider>
          <ScreenNav />
          <Toast messageAtom={toastAtom} topOffset={60} />
        </VexlThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}
