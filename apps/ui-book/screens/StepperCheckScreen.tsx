import {StepperCheck, StepperCheckContainer, YStack} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const steps = [
  {
    label: 'Add your contacts',
    note: 'Connect with friends and expand your network',
  },
  {
    label: 'Set your identity',
    note: 'Add a name and photo to share when you reveal your identity.',
  },
  {
    label: 'Post your first offer',
    note: "Let your network know what you're buying or selling.",
  },
]

function StepList({
  completedCount,
}: {
  readonly completedCount: number
}): React.JSX.Element {
  return (
    <StepperCheckContainer>
      {steps.map((step, index) => (
        <StepperCheck
          key={step.label}
          selected={index < completedCount}
          last={index === steps.length - 1}
          label={step.label}
          note={step.note}
          onPress={
            index < completedCount
              ? undefined
              : () => {
                  Alert.alert('Pressed', step.label)
                }
          }
        />
      ))}
    </StepperCheckContainer>
  )
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="All states (standalone)">
        <YStack gap="$3">
          <StepperCheck
            label="Label"
            note="Note"
            onPress={() => {
              Alert.alert('Pressed', 'Default, not selected')
            }}
          />
          <StepperCheck selected label="Label" note="Note" />
          <StepperCheck
            last
            label="Label"
            note="Note"
            onPress={() => {
              Alert.alert('Pressed', 'Last, not selected')
            }}
          />
          <StepperCheck selected last label="Label" note="Note" />
        </YStack>
      </DemoSection>
      <DemoSection title="In container (realistic)">
        <StepList completedCount={1} />
      </DemoSection>
      <DemoSection title="All completed">
        <StepList completedCount={steps.length} />
      </DemoSection>
      <DemoSection title="None completed">
        <StepList completedCount={0} />
      </DemoSection>
    </>
  )
}

export function StepperCheckScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Stepper Check" demos={Demos} />
}
