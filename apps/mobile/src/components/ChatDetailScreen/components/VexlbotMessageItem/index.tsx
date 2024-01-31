import React from 'react'
import {Stack, Text} from 'tamagui'
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
  if (data.type === 'tradeChecklistSuggestion') {
    return <TradeChecklistReminder />
  }

  if (data.type === 'dateAndTimePreview') {
    return <TradeChecklistDateAndTimeView />
  }

  if (data.type === 'meetingLocationPreview') {
    return <TradeChecklistMeetingLocationView />
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
