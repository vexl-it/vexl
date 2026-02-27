import {SearchBar, SizableText, Theme, XStack, YStack} from '@vexl-next/ui'
import {atom} from 'jotai'
import React from 'react'
import {ScrollView} from 'react-native'

const searchAtomLight = atom('')
const searchAtomDark = atom('')
const searchAtomPrefilledLight = atom('Bitcoin')
const searchAtomPrefilledDark = atom('Bitcoin')
const fullWidthAtomLight = atom('')
const fullWidthAtomDark = atom('')

function ThemedColumn({
  theme,
  searchAtom,
  prefilledAtom,
}: {
  readonly theme: 'light' | 'dark'
  readonly searchAtom: typeof searchAtomLight
  readonly prefilledAtom: typeof searchAtomPrefilledLight
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
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

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Empty
        </SizableText>
        <SearchBar valueAtom={searchAtom} />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          With text (X button visible)
        </SizableText>
        <SearchBar valueAtom={prefilledAtom} />
      </YStack>
    </Theme>
  )
}

export function SearchBarScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Search Bar
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn
            theme="light"
            searchAtom={searchAtomLight}
            prefilledAtom={searchAtomPrefilledLight}
          />
          <ThemedColumn
            theme="dark"
            searchAtom={searchAtomDark}
            prefilledAtom={searchAtomPrefilledDark}
          />
        </XStack>

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$5"
          color="$foregroundPrimary"
          paddingTop="$4"
        >
          Full width
        </SizableText>

        <Theme name="light">
          <YStack
            gap="$4"
            padding="$5"
            backgroundColor="$backgroundPrimary"
            borderRadius="$4"
          >
            <SizableText
              fontFamily="$body"
              fontWeight="600"
              fontSize="$3"
              color="$foregroundPrimary"
            >
              Light
            </SizableText>
            <SearchBar valueAtom={fullWidthAtomLight} />
          </YStack>
        </Theme>

        <Theme name="dark">
          <YStack
            gap="$4"
            padding="$5"
            backgroundColor="$backgroundPrimary"
            borderRadius="$4"
          >
            <SizableText
              fontFamily="$body"
              fontWeight="600"
              fontSize="$3"
              color="$foregroundPrimary"
            >
              Dark
            </SizableText>
            <SearchBar valueAtom={fullWidthAtomDark} />
          </YStack>
        </Theme>
      </YStack>
    </ScrollView>
  )
}
