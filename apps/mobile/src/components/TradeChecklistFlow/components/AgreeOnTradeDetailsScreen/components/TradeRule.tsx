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
      <Stack ai="center" jc="center" h={40} w={40} bc="$grey" br="$3">
        <Typography variant="paragraph" color="$foregroundSecondary">
          {ruleNumber}
        </Typography>
      </Stack>
      <Typography variant="paragraph" color="$foregroundPrimary">
        {title}
      </Typography>
    </XStack>
  )
}

export default TradeRule
