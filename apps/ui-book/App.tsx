import {
  ChevronLeft,
  DuoToneContrastTheme,
  NavButton,
  SearchBar,
  Stack,
  Toast,
  Typography,
  useVexlTheme,
  VexlThemeProvider,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {atom, getDefaultStore, useAtomValue} from 'jotai'

import {StatusBar} from 'expo-status-bar'
import React from 'react'
import {Alert, Platform, ScrollView} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {useMedia} from 'tamagui'
import {toastAtom} from './state/toastAtom'
import {useScreenRoute} from './useScreenRoute'
import {useVexlFonts} from './useVexlFonts'

import {screens} from './screens'

const SIDEBAR_WIDTH = 300

// react-native-web's Alert.alert is a no-op
if (Platform.OS === 'web') {
  Alert.alert = (title, message) => {
    getDefaultStore().set(toastAtom, {title, description: message})
  }
}

const searchAtom = atom('')

function Catalog({
  activeLabel,
  onSelect,
}: {
  readonly activeLabel: string | null
  readonly onSelect: (label: string) => void
}): React.JSX.Element {
  const searchQuery = useAtomValue(searchAtom).trim().toLowerCase()
  const filteredScreens = screens.filter((entry) =>
    entry.label.toLowerCase().includes(searchQuery)
  )

  return (
    <YStack flex={1} backgroundColor="$backgroundPrimary">
      <YStack paddingHorizontal="$5" paddingBottom="$4">
        <SearchBar
          valueAtom={searchAtom}
          placeholder="Search components"
          autoFocus={false}
        />
      </YStack>
      <ScrollView>
        <YStack paddingHorizontal="$5" paddingBottom="$5" gap="$2">
          {filteredScreens.map((entry) => (
            <Stack
              key={entry.label}
              role="link"
              onPress={() => {
                onSelect(entry.label)
              }}
              backgroundColor={
                entry.label === activeLabel
                  ? '$accentYellowSecondary'
                  : '$backgroundSecondary'
              }
              hoverStyle={{opacity: 0.8}}
              pressStyle={{opacity: 0.7}}
              paddingVertical="$4"
              paddingHorizontal="$5"
              borderRadius="$4"
            >
              <Typography
                variant="paragraphSmallBold"
                color={
                  entry.label === activeLabel
                    ? '$accentHighlightSecondary'
                    : '$foregroundPrimary'
                }
              >
                {entry.label}
              </Typography>
            </Stack>
          ))}
          {filteredScreens.length === 0 ? (
            <YStack gap="$2" paddingVertical="$5">
              <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
                No components found
              </Typography>
              <Typography variant="description" color="$foregroundSecondary">
                Try a different search term.
              </Typography>
            </YStack>
          ) : null}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

function ScreenNav(): React.JSX.Element {
  const {resolvedTheme, toggle} = useVexlTheme()
  const insets = useSafeAreaInsets()
  const isWide = useMedia().lg
  const [activeLabel, navigate] = useScreenRoute()
  const activeScreen = screens.find((entry) => entry.label === activeLabel)
  const ActiveScreen = activeScreen?.component
  const showCatalog = isWide || ActiveScreen === undefined

  return (
    <YStack flex={1} backgroundColor="$backgroundPrimary">
      <XStack
        marginTop={insets.top}
        paddingHorizontal="$5"
        paddingVertical="$4"
        alignItems="center"
        gap="$3"
      >
        {!isWide && ActiveScreen !== undefined ? (
          <NavButton
            icon={ChevronLeft}
            variant="normal"
            aria-label="Back to components"
            onPress={() => {
              navigate(null)
            }}
          />
        ) : null}
        <Typography variant="tabLargeBold" color="$foregroundPrimary" flex={1}>
          Vexl UI
        </Typography>
        <NavButton
          icon={DuoToneContrastTheme}
          variant="normal"
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
          onPress={toggle}
        />
      </XStack>

      <XStack flex={1}>
        {/* Hidden instead of unmounted so the catalog keeps its scroll position. */}
        <YStack
          display={showCatalog ? 'flex' : 'none'}
          width={isWide ? SIDEBAR_WIDTH : '100%'}
        >
          <Catalog activeLabel={activeLabel} onSelect={navigate} />
        </YStack>
        {ActiveScreen !== undefined ? (
          <YStack flex={1}>
            <ActiveScreen key={activeLabel} />
          </YStack>
        ) : isWide ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Typography variant="paragraph" color="$foregroundSecondary">
              Pick a component from the list.
            </Typography>
          </YStack>
        ) : null}
      </XStack>

      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </YStack>
  )
}

export default function App(): React.JSX.Element {
  const fontsLoaded = useVexlFonts()

  if (!fontsLoaded) {
    return <></>
  }

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <GestureHandlerRootView style={{flex: 1}}>
          <VexlThemeProvider>
            <ScreenNav />
            <Toast messageAtom={toastAtom} topOffset={60} />
          </VexlThemeProvider>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </SafeAreaProvider>
  )
}
