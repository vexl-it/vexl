import {CodeInput, Typography, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [code, setCode] = useState('12')

  return (
    <YStack gap="$5">
      <Typography variant="micro" color="$foregroundSecondary">
        Interactive (6 digits)
      </Typography>
      <CodeInput
        length={6}
        value={code}
        onChangeText={setCode}
        autoFocus={false}
      />
      <Typography variant="micro" color="$foregroundSecondary">
        Invalid
      </Typography>
      <CodeInput
        length={6}
        value="123456"
        onChangeText={() => {}}
        autoFocus={false}
        invalid
      />
      <Typography variant="micro" color="$foregroundSecondary">
        Disabled
      </Typography>
      <CodeInput
        length={6}
        value="123"
        onChangeText={() => {}}
        autoFocus={false}
        disabled
      />
    </YStack>
  )
}

export function CodeInputScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Code Input" demos={Demos} />
}
