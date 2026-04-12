import {PriceRangeInput, SizableText, Theme, YStack} from '@vexl-next/ui'
import {atom} from 'jotai'
import React, {useCallback} from 'react'
import {Alert, ScrollView} from 'react-native'

const minValueAtomLight = atom(800)
const maxValueAtomLight = atom(15000)
const minValueAtomDark = atom(800)
const maxValueAtomDark = atom(15000)

const minValueMaxLabelAtomLight = atom(800)
const maxValueMaxLabelAtomLight = atom(15000)
const minValueMaxLabelAtomDark = atom(800)
const maxValueMaxLabelAtomDark = atom(15000)

function ThemedColumn({
  themeVariant,
  minValueAtom,
  maxValueAtom,
  maxLabel,
}: {
  readonly themeVariant: 'light' | 'dark'
  readonly minValueAtom: typeof minValueAtomLight
  readonly maxValueAtom: typeof maxValueAtomLight
  readonly maxLabel?: string
}): React.JSX.Element {
  const handleCurrencyPress = useCallback(() => {
    Alert.alert('Currency', 'Navigate to currency selection screen')
  }, [])

  return (
    <Theme name={themeVariant}>
      <YStack
        gap="$3"
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
          {themeVariant.charAt(0).toUpperCase() + themeVariant.slice(1)}
        </SizableText>
        <PriceRangeInput
          minValueAtom={minValueAtom}
          maxValueAtom={maxValueAtom}
          currency="EUR"
          onCurrencyPress={handleCurrencyPress}
          maxLimit={15000}
          maxLabel={maxLabel}
        />
      </YStack>
    </Theme>
  )
}

export function PriceRangeInputScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Price Range Input
        </SizableText>
        <ThemedColumn
          themeVariant="light"
          minValueAtom={minValueAtomLight}
          maxValueAtom={maxValueAtomLight}
        />
        <ThemedColumn
          themeVariant="dark"
          minValueAtom={minValueAtomDark}
          maxValueAtom={maxValueAtomDark}
        />
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          With &quot;Max&quot; label at cap
        </SizableText>
        <ThemedColumn
          themeVariant="light"
          minValueAtom={minValueMaxLabelAtomLight}
          maxValueAtom={maxValueMaxLabelAtomLight}
          maxLabel="Max"
        />
        <ThemedColumn
          themeVariant="dark"
          minValueAtom={minValueMaxLabelAtomDark}
          maxValueAtom={maxValueMaxLabelAtomDark}
          maxLabel="Max"
        />
      </YStack>
    </ScrollView>
  )
}
