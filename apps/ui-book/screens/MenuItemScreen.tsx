import {
  BellNotification,
  FlagReport,
  Lock,
  MenuItem,
  TextTag,
  TrashBin,
  UserProfile,
  YStack,
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
      <DemoSection title="With icon + chevron">
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
      </DemoSection>

      <DemoSection title="With note text">
        <MenuItem
          label="Notifications"
          note="10 connects"
          icon={BellNotification}
          onPress={() => {
            handlePress('Notifications')
          }}
        />
      </DemoSection>

      <DemoSection title="Without chevron">
        <MenuItem
          label="Security"
          icon={Lock}
          showChevron={false}
          onPress={() => {
            handlePress('Security')
          }}
        />
      </DemoSection>

      <DemoSection title="Without icon">
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
      </DemoSection>

      <DemoSection title="With tag">
        <MenuItem
          label="New feature"
          icon={UserProfile}
          tag={<TextTag variant="new" label="New" />}
          onPress={() => {
            handlePress('New feature')
          }}
        />
      </DemoSection>

      <DemoSection title="Danger variant">
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
      </DemoSection>
    </>
  )
}

export function MenuItemScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Menu Item" demos={Demos} />
}
