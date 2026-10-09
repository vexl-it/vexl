import {TradeRule, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <TradeRule ruleNumber={1} title="Trade only with people you know" />
      <TradeRule ruleNumber={2} title="Always money before BTC" />
      <TradeRule
        ruleNumber={3}
        title="Watch out for suspicious behaviour and never share your seed phrase with anyone"
      />
    </YStack>
  )
}

export function TradeRuleScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Trade Rule" demos={Demos} />
}
