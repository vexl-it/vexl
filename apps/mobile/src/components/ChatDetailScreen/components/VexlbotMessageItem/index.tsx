import {type VexlBotMessageData} from './domain'
import {Stack, Text} from 'tamagui'
import React from 'react'
import TradeChecklistReminder from './components/TradeChecklistReminder'
import {useAtomValue} from 'jotai/index'
import {preferencesAtom} from '../../../../utils/preferences'
import TradeChecklistDateAndTimeView from './components/TradeChecklistDateAndTimeView'
import TradeChecklistNetworkView from './components/TradeChecklistNetworkView'

export default function VexlbotMessageItem({
  data,
}: {
  data: VexlBotMessageData
}): JSX.Element | null {
  const preferences = useAtomValue(preferencesAtom)
  if (!preferences.tradeChecklistEnabled) return null

  if (data.type === 'tradeChecklistSuggestion') {
    return <TradeChecklistReminder />
  }

  if (data.type === 'dateAndTimePreview') {
    return <TradeChecklistDateAndTimeView />
  }

  if (data.type === 'networkPreview') {
    return <TradeChecklistNetworkView />
  }

  return (
    <Stack>
      <Text color="$greyOnBlack">{JSON.stringify(data, null, 2)}</Text>
    </Stack>
  )
}
