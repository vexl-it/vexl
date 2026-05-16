import {Stack, Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {chatMolecule} from '../../atoms'
import TradeChecklistReminder from './components/TradeChecklistReminder'
import {type TradingChecklistSuggestion} from './domain'

export default function VexlbotMessageItem({
  data,
}: {
  data: TradingChecklistSuggestion
}): React.ReactElement | null {
  const {otherSideSupportsTradingChecklistAtom} = useMolecule(chatMolecule)
  const otherSideSupportsTradingChecklist = useAtomValue(
    otherSideSupportsTradingChecklistAtom
  )

  if (!otherSideSupportsTradingChecklist) return null
  if (data.type === 'tradeChecklistSuggestion') {
    return <TradeChecklistReminder />
  }

  return (
    <Stack>
      <Typography variant="micro" color="$foregroundSecondary">
        {JSON.stringify(data, null, 2)}
      </Typography>
    </Stack>
  )
}
