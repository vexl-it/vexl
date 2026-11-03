import {BotMessageCard, Button, XStack, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const noop = (): void => {}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <BotMessageCard
        senderLabel="Vexl"
        senderAccentLabel="bot"
        title="Agree on the amount"
        description="Calculate the amount with your trading partner."
        buttonLabel="Calculate amount"
        onButtonPress={noop}
        onClose={noop}
      />
      <BotMessageCard
        senderLabel="Vexl"
        senderAccentLabel="bot"
        statusLabel="Reaction required"
        title="They want to exchange details"
        description="Phone number, photo"
        details={['Review before agreeing.']}
      >
        <XStack gap="$3" width="100%">
          <Button flex={1} size="medium" variant="secondary" onPress={noop}>
            No thanks
          </Button>
          <Button flex={1} size="medium" variant="primary" onPress={noop}>
            Review
          </Button>
        </XStack>
      </BotMessageCard>
      <BotMessageCard
        senderLabel="Vexl"
        senderAccentLabel="bot"
        statusLabel="Outdated"
        statusVariant="outdated"
        title="Suggested meeting date"
        details={['Mon 4. 11. 10:00 - 12:00', 'Tue 5. 11. 14:00 - 16:00']}
        muted
      />
    </YStack>
  )
}

export function BotMessageCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Bot Message Card" demos={Demos} />
}
