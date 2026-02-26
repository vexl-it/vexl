import {FilterBar, SizableText, Theme, XStack, YStack} from '@vexl-next/ui'
import {atom} from 'jotai'
import React from 'react'
import {ScrollView} from 'react-native'

const fewItemsAtom = atom<ReadonlySet<number>>(new Set<number>([0]))
const manyItemsAtom = atom<ReadonlySet<number>>(new Set<number>([0, 1]))
const noneSelectedAtom = atom<ReadonlySet<number>>(new Set<number>())
const allSelectedAtom = atom<ReadonlySet<number>>(
  new Set<number>([0, 1, 2, 3, 4, 5])
)

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

        <SectionLabel>Few items (3)</SectionLabel>
        <FilterBar
          items={['Buy BTC', 'Sell BTC', 'Buy product']}
          selectedIndicesAtom={fewItemsAtom}
        />

        <SectionLabel>None selected</SectionLabel>
        <FilterBar
          items={['Buy BTC', 'Sell BTC', 'Buy product']}
          selectedIndicesAtom={noneSelectedAtom}
        />

        <SectionLabel>All selected</SectionLabel>
        <FilterBar
          items={[
            'Buy BTC',
            'Sell BTC',
            'Buy product',
            'Sell product',
            'Offer service',
            'Request service',
          ]}
          selectedIndicesAtom={allSelectedAtom}
        />
      </YStack>
    </Theme>
  )
}

export function FilterBarScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Filter Bar
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>

        <SectionLabel>Scrollable (overflow)</SectionLabel>
        <FilterBar
          items={[
            'Buy BTC',
            'Sell BTC',
            'Buy product',
            'Sell product',
            'Offer service',
            'Request service',
          ]}
          selectedIndicesAtom={manyItemsAtom}
        />
      </YStack>
    </ScrollView>
  )
}
