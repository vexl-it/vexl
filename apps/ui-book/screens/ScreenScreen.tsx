import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  TitleBlock,
  Typography,
  useScreenFooterHeight,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {ScrollView} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const PREVIEW_HEIGHT = 600

function PreviewFrame({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack
      height={PREVIEW_HEIGHT}
      overflow="hidden"
      borderRadius="$5"
      borderWidth={1}
      borderColor="$backgroundTertiary"
      backgroundColor="$backgroundPrimary"
    >
      {children}
    </YStack>
  )
}

function BackStyleWithFooterExample(): React.JSX.Element {
  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title="Add a nickname"
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
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
        <Typography variant="description" color="$foregroundSecondary">
          Pick a name people will see when you trade.
        </Typography>
        <YStack
          backgroundColor="$backgroundSecondary"
          borderRadius="$5"
          height="$11"
          justifyContent="center"
          paddingHorizontal="$5"
        >
          <Typography variant="paragraph" color="$foregroundPrimary">
            Krabby
          </Typography>
        </YStack>
      </YStack>
    </Screen>
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
            <Typography variant="descriptionBold" color="$foregroundPrimary">
              {`Option ${i + 1}`}
            </Typography>
            <Typography variant="description" color="$foregroundSecondary">
              Scrollable content with sticky footer
            </Typography>
          </YStack>
        ))}
      </YStack>
    </ScrollView>
  )
}

function ScrollWithFooterExample(): React.JSX.Element {
  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title="Select options"
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
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
  )
}

function ReservedFooterSpaceExample(): React.JSX.Element {
  return (
    <Screen
      navigationBar={null}
      reserveFooterSpace
      footer={
        <YStack gap="$3">
          <Button variant="primary">Continue</Button>
          <Button variant="secondary">Back to the list</Button>
        </YStack>
      }
    >
      <YStack flex={1} justifyContent="center">
        <TitleBlock
          align="center"
          size="large"
          title="No navigation bar"
          text="reserveFooterSpace centres this text above the footer instead of under it."
        />
      </YStack>
    </Screen>
  )
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Back style with footer">
        <PreviewFrame>
          <BackStyleWithFooterExample />
        </PreviewFrame>
      </DemoSection>
      <DemoSection title="Scroll with footer">
        <PreviewFrame>
          <ScrollWithFooterExample />
        </PreviewFrame>
      </DemoSection>
      <DemoSection title="No navigation bar, reserved footer space">
        <PreviewFrame>
          <ReservedFooterSpaceExample />
        </PreviewFrame>
      </DemoSection>
    </>
  )
}

export function ScreenScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Screen" demos={Demos} />
}
