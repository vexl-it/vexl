import {type VexlBotMessageData} from './domain'
import {Stack, Text} from 'tamagui'
import React from 'react'
import TradeChecklistReminder from './components/TradeChecklistReminder'
import {useAtomValue} from 'jotai'
import {preferencesAtom} from '../../../../utils/preferences'
import TradeChecklistDateAndTimeView from './components/TradeChecklistDateAndTimeView'
import TradeChecklistNetworkView from './components/TradeChecklistNetworkView'
import TradeChecklistAmountView from './components/TradeChecklistAmountView'
import TradeChecklistIdentityRevealView from './components/TradeChecklistIdentityRevealView'
import TradeChecklistContactRevealView from './components/TradeChecklistContactRevealView'

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

  if (data.type === 'amountPreview') {
    return <TradeChecklistAmountView />
  }

  if (data.type === 'networkPreview') {
    return <TradeChecklistNetworkView />
  }

  if (data.type === 'identityRevealPreview') {
    return <TradeChecklistIdentityRevealView />
  }

  if (data.type === 'contactRevealPreview') {
    return <TradeChecklistContactRevealView />
  }

  return (
    <Stack>
      <Text color="$greyOnBlack">{JSON.stringify(data, null, 2)}</Text>
    </Stack>
  )
}
