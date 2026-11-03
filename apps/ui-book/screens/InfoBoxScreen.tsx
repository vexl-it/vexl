import {
  BellNotification,
  InfoBox,
  type InfoBoxVariant,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

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

function Demos(): React.JSX.Element {
  const [closed, setClosed] = useState(false)

  return (
    <>
      <DemoSection title="Variants">
        {pipe(
          variants,
          Array.map((variant) => (
            <InfoBox key={variant} variant={variant}>
              {`${variant}: ${sampleText}`}
            </InfoBox>
          ))
        )}
      </DemoSection>

      <DemoSection title="Custom icon">
        <InfoBox icon={BellNotification}>{sampleText}</InfoBox>
      </DemoSection>

      <DemoSection title="Loading">
        <InfoBox loading>Re-encrypting your offers...</InfoBox>
      </DemoSection>

      <DemoSection title="onPress (chevron)">
        <InfoBox onPress={noop}>
          Tap to learn more about trading safely.
        </InfoBox>
      </DemoSection>

      <DemoSection title="ReactNode children">
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
      </DemoSection>

      <DemoSection title="Action">
        <InfoBox action={{label: 'Import contacts', onPress: noop}}>
          Import your contacts to see more offers.
        </InfoBox>
      </DemoSection>

      <DemoSection title="onClose">
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
      </DemoSection>

      <DemoSection title="Long multi-line text">
        <InfoBox>{longText}</InfoBox>
      </DemoSection>
    </>
  )
}

export function InfoBoxScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Info Box" demos={Demos} />
}
