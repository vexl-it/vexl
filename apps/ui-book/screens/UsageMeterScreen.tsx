import {Typography, UsageMeter, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'
import {Pressable} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const total = 9

function Demos(): React.JSX.Element {
  const [used, setUsed] = useState(6)
  return (
    <YStack gap="$5">
      <UsageMeter
        used={used}
        total={total}
        label={
          used < total
            ? `Using ${used} of ${total} contacts`
            : `Using all ${total} contacts`
        }
        action={
          <Pressable
            onPress={() => {
              setUsed(used < total ? total : 0)
            }}
          >
            <Typography
              variant="descriptionBold"
              color="$accentHighlightPrimary"
            >
              {used < total ? 'Use all' : 'Use none'}
            </Typography>
          </Pressable>
        }
        linkLabel="Review unused contacts"
        onLinkPress={() => {
          setUsed(Math.min(total, used + 1))
        }}
      />
    </YStack>
  )
}

export function UsageMeterScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Usage Meter" demos={Demos} />
}
