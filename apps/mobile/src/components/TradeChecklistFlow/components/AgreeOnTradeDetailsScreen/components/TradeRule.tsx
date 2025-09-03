import React from 'react'
import {Stack, Text, XStack} from 'tamagui'

interface Props {
  ruleNumber: number
  title: string
}

function TradeRule({ruleNumber, title}: Props): React.ReactElement {
  return (
    <XStack ai="center" gap="$4">
      <Stack ai="center" jc="center" h={40} w={40} bc="$grey" br="$5">
        <Text fos={18} ff="$body500" col="$greyOnBlack">
          {ruleNumber}
        </Text>
      </Stack>
      <Text fos={16} ff="$body500" col="$white">
        {title}
      </Text>
    </XStack>
  )
}

export default TradeRule
