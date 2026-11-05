import {RadioGroup, RowRadiobutton} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

type RowRadiobuttonDemoValue = 'option1' | 'option2' | 'option3'

const rowRadiobuttonDemoValues: readonly RowRadiobuttonDemoValue[] = [
  'option1',
  'option2',
  'option3',
]

function Demos(): React.JSX.Element {
  const [value, setValue] = useState<RowRadiobuttonDemoValue>('option1')

  return (
    <RadioGroup
      allowedValues={rowRadiobuttonDemoValues}
      value={value}
      onValueChange={setValue}
      gap="$3"
    >
      <RowRadiobutton
        value="option1"
        label="Option 1"
        description="Description for the first option"
      />
      <RowRadiobutton
        value="option2"
        label="Option 2"
        description="Description for the second option"
      />
      <RowRadiobutton value="option3" label="Option 3 (no description)" />
    </RadioGroup>
  )
}

export function RowRadiobuttonScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Row Radiobutton" demos={Demos} />
}
