import {CopyField, Typography, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const sampleValue = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'

function Demos(): React.JSX.Element {
  const [copyCount, setCopyCount] = useState(0)
  const onCopy = (): void => {
    setCopyCount((count) => count + 1)
  }

  return (
    <YStack gap="$3">
      <Typography variant="description" color="$foregroundSecondary">
        Copied {copyCount} times
      </Typography>
      <CopyField value={sampleValue} onCopy={onCopy} />
      <CopyField label="Bitcoin address" value={sampleValue} onCopy={onCopy} />
      <CopyField
        label="Disabled"
        value={sampleValue}
        onCopy={onCopy}
        disabled
      />
      <CopyField
        label="On backgroundPrimary"
        value={sampleValue}
        onCopy={onCopy}
        backgroundColor="$backgroundPrimary"
      />
    </YStack>
  )
}

export function CopyFieldScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Copy Field" demos={Demos} />
}
