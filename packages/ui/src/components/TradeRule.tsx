import React from 'react'

import {Stack, XStack} from '../primitives'
import {Typography} from './Typography'

export interface TradeRuleProps {
  readonly ruleNumber: number
  readonly title: string
}

export function TradeRule({
  ruleNumber,
  title,
}: TradeRuleProps): React.JSX.Element {
  return (
    <XStack ai="center" gap="$4">
      <Stack
        ai="center"
        jc="center"
        h={40}
        w={40}
        flexShrink={0}
        bc="$backgroundSecondary"
        br="$3"
      >
        <Typography variant="paragraph" color="$foregroundPrimary">
          {ruleNumber}
        </Typography>
      </Stack>
      <Typography
        variant="paragraph"
        color="$foregroundPrimary"
        flexShrink={1}
        minWidth={0}
        numberOfLines={2}
      >
        {title}
      </Typography>
    </XStack>
  )
}
