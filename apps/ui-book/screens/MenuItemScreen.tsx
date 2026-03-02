import {
  BellNotification,
  FlagReport,
  Lock,
  MenuItem,
  SizableText,
  TextTag,
  Theme,
  TrashBin,
  UserProfile,
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

        <SectionLabel>With icon + chevron</SectionLabel>
        <YStack gap="$3">
          <MenuItem
            label="Report offer"
            icon={FlagReport}
            onPress={() => {
              handlePress('Report offer')
            }}
          />
          <MenuItem
            label="Profile"
            icon={UserProfile}
            onPress={() => {
              handlePress('Profile')
            }}
          />
        </YStack>

        <SectionLabel>With note text</SectionLabel>
        <YStack gap="$3">
          <MenuItem
            label="Notifications"
            note="10 connects"
            icon={BellNotification}
            onPress={() => {
              handlePress('Notifications')
            }}
          />
        </YStack>

        <SectionLabel>Without chevron</SectionLabel>
        <YStack gap="$3">
          <MenuItem
            label="Security"
            icon={Lock}
            showChevron={false}
            onPress={() => {
              handlePress('Security')
            }}
          />
        </YStack>

        <SectionLabel>Without icon</SectionLabel>
        <YStack gap="$3">
          <MenuItem
            label="Plain label"
            onPress={() => {
              handlePress('Plain label')
            }}
          />
          <MenuItem
            label="Plain without chevron"
            showChevron={false}
            onPress={() => {
              handlePress('Plain without chevron')
            }}
          />
        </YStack>

        <SectionLabel>With tag</SectionLabel>
        <YStack gap="$3">
          <MenuItem
            label="New feature"
            icon={UserProfile}
            tag={<TextTag variant="new" label="New" />}
            onPress={() => {
              handlePress('New feature')
            }}
          />
        </YStack>

        <SectionLabel>Danger variant</SectionLabel>
        <YStack gap="$3">
          <MenuItem
            label="Delete account"
            icon={TrashBin}
            variant="danger"
            onPress={() => {
              handlePress('Delete account')
            }}
          />
          <MenuItem
            label="Report offer"
            note="This action cannot be undone"
            icon={FlagReport}
            variant="danger"
            onPress={() => {
              handlePress('Report offer danger')
            }}
          />
        </YStack>
      </YStack>
    </Theme>
  )
}

export function MenuItemScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Menu Item
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
