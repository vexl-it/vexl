import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, Text} from 'tamagui'
import {preferencesAtom} from '../../../../utils/preferences'
import TradeChecklistAmountView from './components/TradeChecklistAmountView'
import TradeChecklistContactRevealView from './components/TradeChecklistContactRevealView'
import TradeChecklistDateAndTimeView from './components/TradeChecklistDateAndTimeView'
import TradeChecklistIdentityRevealView from './components/TradeChecklistIdentityRevealView'
import TradeChecklistMeetingLocationView from './components/TradeChecklistMeetingLocationView'
import TradeChecklistNetworkView from './components/TradeChecklistNetworkView'
import TradeChecklistReminder from './components/TradeChecklistReminder'
import {type VexlBotMessageData} from './domain'

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

  if (data.type === 'meetingLocation') {
    return <TradeChecklistMeetingLocationView />
  }

  return (
    <Stack>
      <Text color="$greyOnBlack">{JSON.stringify(data, null, 2)}</Text>
    </Stack>
  )
}
