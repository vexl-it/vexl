import {
  SizableText,
  StepperCheck,
  StepperCheckContainer,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {Alert, ScrollView} from 'react-native'

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

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const handlePress = useCallback((label: string) => {
    Alert.alert('Pressed', label)
  }, [])

  return (
    <Theme name={theme}>
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
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SectionLabel>All states (standalone)</SectionLabel>
        <YStack gap="$3">
          <StepperCheck
            label="Label"
            note="Note"
            onPress={() => {
              handlePress('Default, not selected')
            }}
          />
          <StepperCheck selected label="Label" note="Note" />
          <StepperCheck
            last
            label="Label"
            note="Note"
            onPress={() => {
              handlePress('Last, not selected')
            }}
          />
          <StepperCheck selected last label="Label" note="Note" />
        </YStack>

        <SectionLabel>In container (realistic)</SectionLabel>
        <StepperCheckContainer>
          <StepperCheck
            selected
            label="Add your contacts"
            note="Connect with friends and expand your network"
          />
          <StepperCheck
            label="Set your identity"
            note="Add a name and photo to share when you reveal your identity."
            onPress={() => {
              handlePress('Set your identity')
            }}
          />
          <StepperCheck
            last
            label="Post your first offer"
            note="Let your network know what you're buying or selling."
            onPress={() => {
              handlePress('Post your first offer')
            }}
          />
        </StepperCheckContainer>

        <SectionLabel>All completed</SectionLabel>
        <StepperCheckContainer>
          <StepperCheck
            selected
            label="Add your contacts"
            note="Connect with friends and expand your network"
          />
          <StepperCheck
            selected
            label="Set your identity"
            note="Add a name and photo to share when you reveal your identity."
          />
          <StepperCheck
            selected
            last
            label="Post your first offer"
            note="Let your network know what you're buying or selling."
          />
        </StepperCheckContainer>

        <SectionLabel>None completed</SectionLabel>
        <StepperCheckContainer>
          <StepperCheck
            label="Add your contacts"
            note="Connect with friends and expand your network"
            onPress={() => {
              handlePress('Add your contacts')
            }}
          />
          <StepperCheck
            label="Set your identity"
            note="Add a name and photo to share when you reveal your identity."
            onPress={() => {
              handlePress('Set your identity')
            }}
          />
          <StepperCheck
            last
            label="Post your first offer"
            note="Let your network know what you're buying or selling."
            onPress={() => {
              handlePress('Post your first offer')
            }}
          />
        </StepperCheckContainer>
      </YStack>
    </Theme>
  )
}

export function StepperCheckScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Stepper Check
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
