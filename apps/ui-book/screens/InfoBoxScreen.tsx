import {
  BellNotification,
  InfoBox,
  type InfoBoxVariant,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const sampleText =
  "Waiting for the other party's response. You'll get a notification once they reply."

const longText =
  'Your offers are encrypted for each of your contacts. When you import new contacts, Vexl re-encrypts your offers so the new contacts can see them too. This may take a while if you have many contacts, and the app needs to stay open until it finishes.'

const variants: readonly InfoBoxVariant[] = [
  'default',
  'yellow',
  'pink',
  'tertiary',
  'error',
  'naked',
]

const noop = (): void => {}

function Label({children}: {readonly children: string}): React.JSX.Element {
  return (
    <Typography variant="description" color="$foregroundSecondary">
      {children}
    </Typography>
  )
}

function Demos(): React.JSX.Element {
  const [closed, setClosed] = useState(false)

  return (
    <YStack gap="$3">
      <Label>Variants</Label>
      {pipe(
        variants,
        Array.map((variant) => (
          <InfoBox key={variant} variant={variant}>
            {`${variant}: ${sampleText}`}
          </InfoBox>
        ))
      )}

      <Label>Custom icon</Label>
      <InfoBox icon={BellNotification}>{sampleText}</InfoBox>

      <Label>Loading</Label>
      <InfoBox loading>Re-encrypting your offers...</InfoBox>

      <Label>onPress (chevron)</Label>
      <InfoBox onPress={noop}>Tap to learn more about trading safely.</InfoBox>

      <Label>ReactNode children</Label>
      <InfoBox variant="yellow">
        <YStack gap="$1">
          <Typography
            variant="descriptionBold"
            color="$accentHighlightSecondary"
          >
            Custom content
          </Typography>
          <Typography variant="description" color="$accentHighlightSecondary">
            Non-string children are rendered as-is, so they control their own
            styling.
          </Typography>
        </YStack>
      </InfoBox>

      <Label>Action</Label>
      <InfoBox action={{label: 'Import contacts', onPress: noop}}>
        Import your contacts to see more offers.
      </InfoBox>

      <Label>onClose</Label>
      {closed ? (
        <InfoBox
          variant="tertiary"
          onPress={() => {
            setClosed(false)
          }}
        >
          Closed. Tap to show again.
        </InfoBox>
      ) : (
        <InfoBox
          onClose={() => {
            setClosed(true)
          }}
        >
          {sampleText}
        </InfoBox>
      )}

      <Label>Long multi-line text</Label>
      <InfoBox>{longText}</InfoBox>
    </YStack>
  )
}

export function InfoBoxScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Info Box" demos={Demos} />
}
