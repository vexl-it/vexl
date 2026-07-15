import {RadioGroup, RowRadiobutton, Typography, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

type DemoValue = 'friends' | 'clubs' | 'everyone'

const demoValues: readonly DemoValue[] = ['friends', 'clubs', 'everyone']

function Demos(): React.JSX.Element {
  const [value, setValue] = useState<DemoValue>('friends')
  const [lastRepeatedValue, setLastRepeatedValue] =
    useState<DemoValue>('friends')

  return (
    <YStack gap="$3">
      <Typography variant="description" color="$foregroundSecondary">
        Selected: {value}. Press the selected row again to exercise
        onSelectedValuePress.
      </Typography>
      <RadioGroup
        allowedValues={demoValues}
        value={value}
        onValueChange={setValue}
        onSelectedValuePress={setLastRepeatedValue}
        gap="$3"
      >
        <RowRadiobutton
          value="friends"
          label="Friends"
          description="People directly connected to you"
        />
        <RowRadiobutton
          value="clubs"
          label="Clubs"
          description="Members of your communities"
        />
        <RowRadiobutton value="everyone" label="Everyone" />
      </RadioGroup>
      <Typography variant="micro" color="$foregroundTertiary">
        Last repeated selection: {lastRepeatedValue}
      </Typography>
    </YStack>
  )
}

export function RadioGroupScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Radio Group" demos={Demos} />
}
