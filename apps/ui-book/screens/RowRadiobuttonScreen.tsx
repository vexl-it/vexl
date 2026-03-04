import {RowRadiobutton, SizableText, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'
import {RadioGroup, Theme} from 'tamagui'

export function RowRadiobuttonScreen(): React.JSX.Element {
  const [value, setValue] = useState('option1')
  const [darkValue, setDarkValue] = useState('option1')

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: '#F5F3ED'}}
      contentContainerStyle={{padding: 16, gap: 16}}
    >
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

      <Theme name="dark">
        <YStack
          padding="$5"
          gap="$5"
          backgroundColor="$backgroundPrimary"
          borderRadius="$5"
        >
          <SizableText fontWeight="600" fontSize="$5">
            Dark Mode
          </SizableText>

          <RadioGroup value={darkValue} onValueChange={setDarkValue} gap="$3">
            <RowRadiobutton
              value="option1"
              selected={darkValue === 'option1'}
              label="Option 1"
              description="Description for the first option"
            />
            <RowRadiobutton
              value="option2"
              selected={darkValue === 'option2'}
              label="Option 2"
              description="Description for the second option"
            />
            <RowRadiobutton
              value="option3"
              selected={darkValue === 'option3'}
              label="Option 3 (no description)"
            />
          </RadioGroup>
        </YStack>
      </Theme>
    </ScrollView>
  )
}
