import {RowCheckbox, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set())

  const toggle = (key: string, value: boolean): void => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (value) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  return (
    <>
      <DemoSection title="Without description">
        <YStack gap="$3">
          <RowCheckbox
            label="Option A"
            checked={checked.has('a')}
            onCheckedChange={(v) => {
              toggle('a', v)
            }}
          />
          <RowCheckbox
            label="Option B"
            checked={checked.has('b')}
            onCheckedChange={(v) => {
              toggle('b', v)
            }}
          />
        </YStack>
      </DemoSection>
      <DemoSection title="With description">
        <YStack gap="$3">
          <RowCheckbox
            label="Enable notifications"
            description="Receive push notifications for new messages"
            checked={checked.has('notif')}
            onCheckedChange={(v) => {
              toggle('notif', v)
            }}
          />
          <RowCheckbox
            label="Dark mode"
            description="Switch to a darker color scheme"
            checked={checked.has('dark')}
            onCheckedChange={(v) => {
              toggle('dark', v)
            }}
          />
          <RowCheckbox
            label="Analytics"
            description="Help improve the app by sharing usage data"
            checked={checked.has('analytics')}
            onCheckedChange={(v) => {
              toggle('analytics', v)
            }}
          />
        </YStack>
      </DemoSection>
      <DemoSection title="Circle shape">
        <YStack gap="$3">
          <RowCheckbox
            shape="circle"
            label="Lightning"
            description="Best for smaller amounts. Fast and cheap."
            checked={checked.has('lightning')}
            onCheckedChange={(v) => {
              toggle('lightning', v)
            }}
          />
          <RowCheckbox
            shape="circle"
            label="On-chain"
            description="Best for larger amounts. Slower, but more secure."
            checked={checked.has('onChain')}
            onCheckedChange={(v) => {
              toggle('onChain', v)
            }}
          />
        </YStack>
      </DemoSection>
      <DemoSection title="Compact">
        <RowCheckbox
          compact
          label="Don't show me this again"
          checked={checked.has('compact')}
          onCheckedChange={(v) => {
            toggle('compact', v)
          }}
        />
      </DemoSection>
    </>
  )
}

export function RowCheckboxScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Row Checkbox" demos={Demos} />
}
