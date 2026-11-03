import {CardButton, OffersReencryptionStatus, Typography} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [startedAt, setStartedAt] = useState<number | null>(
    () => Date.now() - 1000
  )

  return (
    <DemoSection title="Appears after one second">
      <OffersReencryptionStatus
        startedAt={startedAt}
        label="Encrypting offers for new connections…"
      />
      <Typography variant="description" color="$foregroundSecondary">
        Finishing hides it immediately.
      </Typography>
      <CardButton
        onPress={() => {
          setStartedAt(Date.now())
        }}
      >
        Start / restart
      </CardButton>
      <CardButton
        type="text"
        onPress={() => {
          setStartedAt(null)
        }}
      >
        Finish
      </CardButton>
    </DemoSection>
  )
}

export function OffersReencryptionStatusScreen(): React.JSX.Element {
  return (
    <ComponentScreenLayout title="Offers Reencryption Status" demos={Demos} />
  )
}
