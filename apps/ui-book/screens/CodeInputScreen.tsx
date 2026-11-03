import {CodeInput, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [code, setCode] = useState('12')

  return (
    <YStack gap="$5">
      <DemoSection title="Interactive (6 digits)">
        <CodeInput
          length={6}
          value={code}
          onChangeText={setCode}
          autoFocus={false}
        />
      </DemoSection>
      <DemoSection title="Invalid">
        <CodeInput
          length={6}
          value="123456"
          onChangeText={() => {}}
          autoFocus={false}
          invalid
        />
      </DemoSection>
      <DemoSection title="Disabled">
        <CodeInput
          length={6}
          value="123"
          onChangeText={() => {}}
          autoFocus={false}
          disabled
        />
      </DemoSection>
    </YStack>
  )
}

export function CodeInputScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Code Input" demos={Demos} />
}
