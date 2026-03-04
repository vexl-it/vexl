import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  SizableText,
  Stack,
  Theme,
  TuneSettings,
  UserProfile,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

const TOP_INSET = 59
const BOTTOM_INSET = 34

type ActiveExample =
  | 'main-dark'
  | 'main-light'
  | 'backFooter-dark'
  | 'backFooter-light'
  | 'scrolled-dark'
  | 'scrolled-light'
  | 'graphicHeader-dark'
  | 'graphicHeader-light'
  | null

function MainStyleExample({
  onBack,
  theme,
}: {
  readonly onBack: () => void
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack flex={1}>
        <Screen
          topInset={TOP_INSET}
          bottomInset={BOTTOM_INSET}
          navigationBar={
            <NavigationBar
              style="main"
              title="Marketplace"
              rightActions={[
                {icon: TuneSettings, onPress: () => {}},
                {icon: UserProfile, onPress: onBack},
              ]}
            />
          }
        >
          <YStack gap="$5" paddingTop="$5">
            {Array.from({length: 20}, (_, i) => (
              <YStack
                key={i}
                backgroundColor="$backgroundSecondary"
                borderRadius="$5"
                padding="$5"
                gap="$3"
              >
                <SizableText
                  fontFamily="$body"
                  fontWeight="600"
                  fontSize="$2"
                  color="$foregroundPrimary"
                >
                  {`Card item ${i + 1}`}
                </SizableText>
                <SizableText
                  fontFamily="$body"
                  fontWeight="500"
                  fontSize="$2"
                  color="$foregroundSecondary"
                >
                  Scrollable content demo
                </SizableText>
              </YStack>
            ))}
          </YStack>
        </Screen>
      </YStack>
    </Theme>
  )
}

function BackStyleWithFooterExample({
  onBack,
  theme,
}: {
  readonly onBack: () => void
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack flex={1}>
        <Screen
          topInset={TOP_INSET}
          bottomInset={BOTTOM_INSET}
          navigationBar={
            <NavigationBar
              style="back"
              title="Add a nickname"
              leftAction={{icon: ChevronLeft, onPress: onBack}}
              rightActions={[{icon: XmarkCancelClose, onPress: () => {}}]}
            />
          }
          footer={
            <Button variant="primary" size="large">
              Next
            </Button>
          }
        >
          <YStack gap="$8" paddingTop="$5">
            <SizableText
              fontFamily="$body"
              fontWeight="500"
              fontSize="$2"
              color="$foregroundSecondary"
            >
              Pick a name people will see when you trade.
            </SizableText>
            <YStack
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              height="$11"
              justifyContent="center"
              paddingHorizontal="$5"
            >
              <SizableText
                fontFamily="$body"
                fontWeight="500"
                fontSize="$4"
                color="$foregroundPrimary"
              >
                Krabby
              </SizableText>
            </YStack>
          </YStack>
        </Screen>
      </YStack>
    </Theme>
  )
}

function ScrolledNavExample({
  onBack,
  theme,
}: {
  readonly onBack: () => void
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [scrolled, setScrolled] = useState(false)

  return (
    <Theme name={theme}>
      <YStack flex={1}>
        <Screen
          topInset={TOP_INSET}
          bottomInset={BOTTOM_INSET}
          navigationBar={
            <NavigationBar
              style="main"
              title="Community"
              scrolled={scrolled}
              rightActions={[{icon: UserProfile, onPress: onBack}]}
            />
          }
        >
          <YStack
            gap="$5"
            paddingTop="$5"
            onLayout={() => {
              setScrolled(false)
            }}
          >
            <SizableText
              fontFamily="$body"
              fontWeight="500"
              fontSize="$2"
              color="$foregroundSecondary"
            >
              Scroll down to see the navigation bar background change
            </SizableText>
            {Array.from({length: 20}, (_, i) => (
              <YStack
                key={i}
                backgroundColor="$backgroundSecondary"
                borderRadius="$5"
                padding="$5"
              >
                <SizableText
                  fontFamily="$body"
                  fontWeight="500"
                  fontSize="$2"
                  color="$foregroundPrimary"
                >
                  {`Item ${i + 1}`}
                </SizableText>
              </YStack>
            ))}
          </YStack>
        </Screen>
      </YStack>
    </Theme>
  )
}

function GraphicHeaderExample({
  onBack,
  theme,
}: {
  readonly onBack: () => void
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack flex={1}>
        <Screen
          topInset={TOP_INSET}
          bottomInset={BOTTOM_INSET}
          graphicHeader
          navigationBar={(scrolled) => (
            <NavigationBar
              style="main"
              title="Chats"
              scrolled={scrolled}
              rightActions={[
                {icon: TuneSettings, onPress: () => {}},
                {icon: UserProfile, onPress: onBack},
              ]}
            />
          )}
        >
          <YStack gap="$5" paddingTop="$5">
            <SizableText
              fontFamily="$body"
              fontWeight="500"
              fontSize="$2"
              color="$foregroundSecondary"
            >
              Navigation bar floats over content. Scroll to see it get a
              background.
            </SizableText>
            {Array.from({length: 20}, (_, i) => (
              <YStack
                key={i}
                backgroundColor="$backgroundSecondary"
                borderRadius="$5"
                padding="$5"
                gap="$3"
              >
                <SizableText
                  fontFamily="$body"
                  fontWeight="600"
                  fontSize="$2"
                  color="$foregroundPrimary"
                >
                  {`Chat item ${i + 1}`}
                </SizableText>
                <SizableText
                  fontFamily="$body"
                  fontWeight="500"
                  fontSize="$2"
                  color="$foregroundSecondary"
                >
                  Message preview text
                </SizableText>
              </YStack>
            ))}
          </YStack>
        </Screen>
      </YStack>
    </Theme>
  )
}

const examples: ReadonlyArray<{
  readonly key: ActiveExample & string
  readonly label: string
}> = [
  {key: 'main-dark', label: 'Main style (dark)'},
  {key: 'main-light', label: 'Main style (light)'},
  {key: 'backFooter-dark', label: 'Back style with footer (dark)'},
  {key: 'backFooter-light', label: 'Back style with footer (light)'},
  {key: 'scrolled-dark', label: 'Scrolled nav background (dark)'},
  {key: 'scrolled-light', label: 'Scrolled nav background (light)'},
  {key: 'graphicHeader-dark', label: 'Graphic header (dark)'},
  {key: 'graphicHeader-light', label: 'Graphic header (light)'},
]

function ActiveScreen({
  active,
  onBack,
}: {
  readonly active: ActiveExample & string
  readonly onBack: () => void
}): React.JSX.Element {
  const theme = active.endsWith('-light') ? 'light' : 'dark'

  if (active.startsWith('main'))
    return <MainStyleExample onBack={onBack} theme={theme} />
  if (active.startsWith('backFooter'))
    return <BackStyleWithFooterExample onBack={onBack} theme={theme} />
  if (active.startsWith('graphicHeader'))
    return <GraphicHeaderExample onBack={onBack} theme={theme} />
  return <ScrolledNavExample onBack={onBack} theme={theme} />
}

export function ScreenScreen(): React.JSX.Element {
  const [active, setActive] = useState<ActiveExample>(null)

  const goBack = (): void => {
    setActive(null)
  }

  if (active) return <ActiveScreen active={active} onBack={goBack} />

  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$5">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Screen
        </SizableText>
        {examples.map((ex) => (
          <Stack
            key={ex.key}
            onPress={() => {
              setActive(ex.key)
            }}
            backgroundColor="$backgroundSecondary"
            paddingVertical="$5"
            paddingHorizontal="$5"
            borderRadius="$4"
            pressStyle={{opacity: 0.7}}
          >
            <SizableText
              fontFamily="$body"
              fontWeight="600"
              fontSize="$2"
              color="$foregroundPrimary"
            >
              {ex.label}
            </SizableText>
          </Stack>
        ))}
      </YStack>
    </ScrollView>
  )
}
