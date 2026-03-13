import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  SizableText,
  Stack,
  Theme,
  useScreenFooterHeight,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

type ActiveExample =
  | 'backFooter-dark'
  | 'backFooter-light'
  | 'scrollFooter-dark'
  | 'scrollFooter-light'
  | null

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
          <YStack gap="$8">
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

function ScrollWithFooterContent(): React.JSX.Element {
  const {footerHeightAtom} = useScreenFooterHeight()
  const footerHeight = useAtomValue(footerHeightAtom)

  return (
    <ScrollView contentContainerStyle={{paddingBottom: footerHeight}}>
      <YStack gap="$5">
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
              {`Option ${i + 1}`}
            </SizableText>
            <SizableText
              fontFamily="$body"
              fontWeight="500"
              fontSize="$2"
              color="$foregroundSecondary"
            >
              Scrollable content with sticky footer
            </SizableText>
          </YStack>
        ))}
      </YStack>
    </ScrollView>
  )
}

function ScrollWithFooterExample({
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
          navigationBar={
            <NavigationBar
              style="back"
              title="Select options"
              leftAction={{icon: ChevronLeft, onPress: onBack}}
            />
          }
          footer={
            <Button variant="primary" size="large">
              Confirm
            </Button>
          }
        >
          <ScrollWithFooterContent />
        </Screen>
      </YStack>
    </Theme>
  )
}

const examples: ReadonlyArray<{
  readonly key: ActiveExample & string
  readonly label: string
}> = [
  {key: 'backFooter-dark', label: 'Back style with footer (dark)'},
  {key: 'backFooter-light', label: 'Back style with footer (light)'},
  {key: 'scrollFooter-dark', label: 'Scroll with footer (dark)'},
  {key: 'scrollFooter-light', label: 'Scroll with footer (light)'},
]

function ActiveScreen({
  active,
  onBack,
}: {
  readonly active: ActiveExample & string
  readonly onBack: () => void
}): React.JSX.Element {
  const theme = active.endsWith('-light') ? 'light' : 'dark'

  if (active.startsWith('scrollFooter'))
    return <ScrollWithFooterExample onBack={onBack} theme={theme} />
  return <BackStyleWithFooterExample onBack={onBack} theme={theme} />
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
