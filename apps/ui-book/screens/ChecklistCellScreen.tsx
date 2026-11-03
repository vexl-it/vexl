import {
  Calendar,
  ChecklistCell,
  Map,
  MathCalculate,
  PeopleUsers,
  PinGeolocation,
  YStack,
} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const handlePress = useCallback((label: string) => {
    Alert.alert('Pressed', label)
  }, [])

  return (
    <YStack gap="$5">
      <DemoSection title="Completed">
        <YStack gap="$3">
          <ChecklistCell
            state="completed"
            headline="Select date and time"
            subtitle="Selected 3 date options"
          />
          <ChecklistCell
            state="completed"
            headline="Set meeting location"
            subtitle="Set: Vinohradsky pivovar"
          />
        </YStack>
      </DemoSection>

      <DemoSection title="Initial (with icon)">
        <YStack gap="$3">
          <ChecklistCell
            state="initial"
            headline="Select date and time"
            subtitle="Overline"
            icon={Calendar}
            onPress={() => {
              handlePress('Select date and time')
            }}
          />
          <ChecklistCell
            state="initial"
            headline="Set meeting location"
            subtitle="Vinohrady, radius 0.3 km"
            icon={PinGeolocation}
            onPress={() => {
              handlePress('Set meeting location')
            }}
          />
          <ChecklistCell
            state="initial"
            headline="Set trade amount"
            subtitle="300 - 3,000 CZK"
            icon={MathCalculate}
            onPress={() => {
              handlePress('Set trade amount')
            }}
          />
          <ChecklistCell
            state="initial"
            headline="Reveal identity"
            icon={PeopleUsers}
            onPress={() => {
              handlePress('Reveal identity')
            }}
          />
        </YStack>
      </DemoSection>

      <DemoSection title="Pending">
        <YStack gap="$3">
          <ChecklistCell
            state="pending"
            headline="Set meeting location"
            subtitle="Waiting for response"
            onPress={() => {
              handlePress('Set meeting location pending')
            }}
          />
          <ChecklistCell
            state="pending"
            headline="Choose network"
            subtitle="Lightning"
            onPress={() => {
              handlePress('Choose network pending')
            }}
          />
        </YStack>
      </DemoSection>

      <DemoSection title="Mixed (realistic checklist)">
        <YStack gap="$3">
          <ChecklistCell
            state="completed"
            headline="Select date and time"
            subtitle="Selected 3 date options"
          />
          <ChecklistCell
            state="completed"
            headline="Set meeting location"
            subtitle="Set: Vinohradsky pivovar"
          />
          <ChecklistCell
            state="pending"
            headline="Set trade amount"
            subtitle="Waiting for response"
            onPress={() => {
              handlePress('Set trade amount')
            }}
          />
          <ChecklistCell
            state="initial"
            headline="Choose network"
            subtitle="Lightning"
            icon={Map}
            onPress={() => {
              handlePress('Choose network')
            }}
          />
        </YStack>
      </DemoSection>
    </YStack>
  )
}

export function ChecklistCellScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Checklist Cell" demos={Demos} />
}
