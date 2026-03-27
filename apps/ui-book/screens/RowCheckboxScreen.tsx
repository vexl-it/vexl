import {RowCheckbox, SizableText, Theme, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <SizableText
      fontFamily="$body"
      fontWeight="600"
      fontSize="$2"
      color="$foregroundSecondary"
      paddingTop="$3"
    >
      {children}
    </SizableText>
  )
}

function InteractiveGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
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
    <Theme name={theme}>
      <YStack
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SectionLabel>Without description</SectionLabel>
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

        <SectionLabel>With description</SectionLabel>
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
      </YStack>
    </Theme>
  )
}

export function RowCheckboxScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Row Checkbox
        </SizableText>

        <InteractiveGroup theme="light" />
        <InteractiveGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
