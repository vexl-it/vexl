import {
  BellNotification,
  FlagReport,
  Lock,
  Menu,
  MenuItem,
  SizableText,
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

        <SectionLabel>Default (3 items)</SectionLabel>
        <Menu>
          <MenuItem
            label="Display QR code"
            icon={UserProfile}
            onPress={() => {
              handlePress('Display QR code')
            }}
          />
          <MenuItem
            label="Invite user with code"
            icon={BellNotification}
            onPress={() => {
              handlePress('Invite user with code')
            }}
          />
          <MenuItem
            label="Regenerate invite code"
            icon={Lock}
            onPress={() => {
              handlePress('Regenerate invite code')
            }}
          />
        </Menu>

        <SectionLabel>With notes</SectionLabel>
        <Menu>
          <MenuItem
            label="Notifications"
            note="10 connects"
            icon={BellNotification}
            onPress={() => {
              handlePress('Notifications')
            }}
          />
          <MenuItem
            label="Security"
            note="Biometric enabled"
            icon={Lock}
            onPress={() => {
              handlePress('Security')
            }}
          />
        </Menu>

        <SectionLabel>Danger variant</SectionLabel>
        <Menu>
          <MenuItem
            label="Report user"
            icon={FlagReport}
            variant="danger"
            onPress={() => {
              handlePress('Report user')
            }}
          />
          <MenuItem
            label="Delete account"
            icon={TrashBin}
            variant="danger"
            onPress={() => {
              handlePress('Delete account')
            }}
          />
        </Menu>

        <SectionLabel>Single item</SectionLabel>
        <Menu>
          <MenuItem
            label="Profile settings"
            icon={UserProfile}
            onPress={() => {
              handlePress('Profile settings')
            }}
          />
        </Menu>
      </YStack>
    </Theme>
  )
}

export function MenuScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Menu
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
