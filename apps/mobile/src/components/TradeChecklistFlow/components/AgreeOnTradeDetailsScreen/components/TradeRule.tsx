import {Typography} from '@vexl-next/ui'
import React from 'react'
import {Stack, XStack} from 'tamagui'

interface Props {
  ruleNumber: number
  title: string
}

function TradeRule({ruleNumber, title}: Props): React.ReactElement {
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

export default TradeRule
