import {RowRadiobutton, SizableText, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'
import {RadioGroup} from 'tamagui'

export function RowRadiobuttonScreen(): React.JSX.Element {
  const [value, setValue] = useState('option1')

  return (
    <YStack flex={1} padding="$5" gap="$5" backgroundColor="$backgroundPrimary">
      <SizableText fontWeight="600" fontSize="$5">
        Row Radiobutton
      </SizableText>

      <RadioGroup value={value} onValueChange={setValue} gap="$3">
        <RowRadiobutton
          value="option1"
          selected={value === 'option1'}
          label="Option 1"
          description="Description for the first option"
        />
        <RowRadiobutton
          value="option2"
          selected={value === 'option2'}
          label="Option 2"
          description="Description for the second option"
        />
        <RowRadiobutton
          value="option3"
          selected={value === 'option3'}
          label="Option 3 (no description)"
        />
      </RadioGroup>

      <SizableText fontWeight="600" fontSize="$5">
        Disabled
      </SizableText>

      <RadioGroup value="disabled1" gap="$3">
        <RowRadiobutton
          value="disabled1"
          selected
          label="Selected Disabled"
          description="This option is disabled"
          disabled
        />
        <RowRadiobutton
          value="disabled2"
          label="Unselected Disabled"
          disabled
        />
      </RadioGroup>
    </YStack>
  )
}
