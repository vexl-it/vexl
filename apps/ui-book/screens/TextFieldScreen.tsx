import {SizableText, TextField, Theme, YStack} from '@vexl-next/ui'
import {TrashBin} from '@vexl-next/ui/src/icons/TrashBin'
import {atom} from 'jotai'
import React from 'react'
import {Alert, ScrollView} from 'react-native'

const plainAtomLight = atom('')
const plainAtomDark = atom('')
const clearAtomLight = atom('Hello')
const clearAtomDark = atom('Hello')
const checkmarkAtomLight = atom('')
const checkmarkAtomDark = atom('')
const textButtonAtomLight = atom('Holešovice 238/8, Prague 7')
const textButtonAtomDark = atom('Holešovice 238/8, Prague 7')
const customIconAtomLight = atom('Vinohradská 123/34 CZ')
const customIconAtomDark = atom('Vinohradská 123/34 CZ')
const placeholderAtomLight = atom('')
const placeholderAtomDark = atom('')

function showAlert(message: string): void {
  Alert.alert('Action', message)
}

function ThemedColumn({
  themeVariant,
  plainAtom,
  clearAtom,
  checkmarkAtom,
  textButtonAtom,
  customIconAtom,
  placeholderAtom,
}: {
  readonly themeVariant: 'light' | 'dark'
  readonly plainAtom: typeof plainAtomLight
  readonly clearAtom: typeof clearAtomLight
  readonly checkmarkAtom: typeof checkmarkAtomLight
  readonly textButtonAtom: typeof textButtonAtomLight
  readonly customIconAtom: typeof customIconAtomLight
  readonly placeholderAtom: typeof placeholderAtomLight
}): React.JSX.Element {
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

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Plain
        </SizableText>
        <TextField valueAtom={plainAtom} />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Clear icon
        </SizableText>
        <TextField valueAtom={clearAtom} showClear />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Checkmark button
        </SizableText>
        <TextField
          valueAtom={checkmarkAtom}
          onCheckmarkPress={() => {
            showAlert('Checkmark pressed')
          }}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Placeholder
        </SizableText>
        <TextField valueAtom={placeholderAtom} placeholder="Search location" />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Text button
        </SizableText>
        <TextField
          valueAtom={textButtonAtom}
          buttonLabel="Change"
          onButtonPress={() => {
            showAlert('Change pressed')
          }}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Custom icon
        </SizableText>
        <TextField
          valueAtom={customIconAtom}
          icon={TrashBin}
          onIconPress={() => {
            showAlert('Trash pressed')
          }}
        />
      </YStack>
    </Theme>
  )
}

export function TextFieldScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Text Field
        </SizableText>

        <ThemedColumn
          themeVariant="light"
          plainAtom={plainAtomLight}
          clearAtom={clearAtomLight}
          checkmarkAtom={checkmarkAtomLight}
          textButtonAtom={textButtonAtomLight}
          customIconAtom={customIconAtomLight}
          placeholderAtom={placeholderAtomLight}
        />
        <ThemedColumn
          themeVariant="dark"
          plainAtom={plainAtomDark}
          clearAtom={clearAtomDark}
          checkmarkAtom={checkmarkAtomDark}
          textButtonAtom={textButtonAtomDark}
          customIconAtom={customIconAtomDark}
          placeholderAtom={placeholderAtomDark}
        />
      </YStack>
    </ScrollView>
  )
}
