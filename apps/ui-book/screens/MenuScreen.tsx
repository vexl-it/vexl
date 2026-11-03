import {
  BellNotification,
  FlagReport,
  Lock,
  Menu,
  MenuItem,
  TrashBin,
  UserProfile,
} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function handlePress(label: string): void {
  Alert.alert('Pressed', label)
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Default (3 items)">
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
      </DemoSection>

      <DemoSection title="With notes">
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
      </DemoSection>

      <DemoSection title="Danger variant">
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
      </DemoSection>

      <DemoSection title="Single item">
        <Menu>
          <MenuItem
            label="Profile settings"
            icon={UserProfile}
            onPress={() => {
              handlePress('Profile settings')
            }}
          />
        </Menu>
      </DemoSection>
    </>
  )
}

export function MenuScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Menu" demos={Demos} />
}
