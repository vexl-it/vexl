import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, Text} from 'tamagui'
import {chatMolecule} from '../../atoms'
import TradeChecklistReminder from './components/TradeChecklistReminder'
import {type TradingChecklistSuggestion} from './domain'

export default function VexlbotMessageItem({
  data,
}: {
  data: TradingChecklistSuggestion
}): JSX.Element | null {
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
      <Text color="$greyOnBlack">{JSON.stringify(data, null, 2)}</Text>
    </Stack>
  )
}
