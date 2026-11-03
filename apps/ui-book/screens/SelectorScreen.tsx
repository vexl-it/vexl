import {
  BellNotification,
  Lock,
  ScreenCaptureShot,
  Selector,
  TuneSettings,
  UserProfile,
  YStack,
} from '@vexl-next/ui'
import {atom} from 'jotai'
import React, {useState} from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const actions = [
  {label: 'Profile', icon: UserProfile},
  {label: 'Settings', icon: TuneSettings},
  {label: 'Security', icon: Lock},
  {label: 'No icon', icon: undefined},
]

function Demos(): React.JSX.Element {
  const [screenCaptureAtom] = useState(() => atom(false))
  const [notificationsAtom] = useState(() => atom(true))

  return (
    <>
      <DemoSection title="Action (with chevron)">
        <YStack gap="$3">
          {actions.map((action) => (
            <Selector
              key={action.label}
              label={action.label}
              icon={action.icon}
              onPress={() => {
                Alert.alert('Pressed', action.label)
              }}
            />
          ))}
        </YStack>
      </DemoSection>
      <DemoSection title="Accent (chosen value)">
        <Selector
          accent
          label="+ 2 %"
          onPress={() => {
            Alert.alert('Pressed', 'Accent')
          }}
        />
      </DemoSection>
      <DemoSection title="Switch (with toggle)">
        <YStack gap="$3">
          <Selector
            variant="switch"
            label="Allow screencapture"
            icon={ScreenCaptureShot}
            valueAtom={screenCaptureAtom}
          />
          <Selector
            variant="switch"
            label="Notifications"
            icon={BellNotification}
            valueAtom={notificationsAtom}
          />
        </YStack>
      </DemoSection>
    </>
  )
}

export function SelectorScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Selector" demos={Demos} />
}
