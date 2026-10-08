import {Button, VexlbotActionCard, XStack, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <VexlbotActionCard
        brandLabel="Vexl"
        botLabel="bot"
        statusLabel="Pending"
        title="You asked to reveal identity"
        description="Name, photo, phone number"
        details={['Your details stay hidden until they agree.']}
      />
      <VexlbotActionCard
        brandLabel="Vexl"
        botLabel="bot"
        statusLabel="Reaction required"
        title="They want to reveal identity"
        description="Name, photo"
        details={['Review what you share before agreeing.']}
      >
        <XStack gap="$3" width="100%">
          <Button flex={1} size="medium" variant="secondary">
            No thanks
          </Button>
          <Button flex={1} size="medium" variant="primary">
            Review
          </Button>
        </XStack>
      </VexlbotActionCard>
      <VexlbotActionCard
        brandLabel="Vexl"
        botLabel="bot"
        title="Need help with your trade?"
        description="Vexlbot can guide you through the trade checklist."
        buttonText="Open checklist"
        onPress={() => {}}
        onClosePress={() => {}}
      />
      <VexlbotActionCard
        brandLabel="Vexl"
        botLabel="bot"
        title="You're all set for the meeting"
      />
    </YStack>
  )
}

export function VexlbotActionCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Vexlbot Action Card" demos={Demos} />
}
