import {SizableText, Tabs, Theme, XStack, YStack} from '@vexl-next/ui'
import {atom} from 'jotai'
import React from 'react'
import {ScrollView} from 'react-native'

const largeTwoAtom = atom(0)
const smallFiveAtom = atom(0)
const scrollableAtom = atom(0)

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <SizableText
      fontFamily="$body"
      fontWeight="600"
      fontSize="$2"
      color="$foregroundSecondary"
      paddingTop="$3"
    >
      {children}
    </SizableText>
  )
}

function ThemedColumn({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack
        gap="$5"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
        flex={1}
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SectionLabel>Large (2 items)</SectionLabel>
        <Tabs
          items={['Offers', 'Messages']}
          activeIndexAtom={largeTwoAtom}
          size="large"
        />

        <SectionLabel>Small (5 items)</SectionLabel>
        <Tabs
          items={['All', 'Buy', 'Sell', 'Saved', 'Drafts']}
          activeIndexAtom={smallFiveAtom}
          size="small"
        />
      </YStack>
    </Theme>
  )
}

export function TabsScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Tabs
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>

        <SectionLabel>Scrollable (overflow)</SectionLabel>
        <Tabs
          items={[
            'Featured',
            'Nearby',
            'Recent',
            'Popular',
            'Trending',
            'Recommended',
          ]}
          activeIndexAtom={scrollableAtom}
          size="large"
        />
      </YStack>
    </ScrollView>
  )
}
