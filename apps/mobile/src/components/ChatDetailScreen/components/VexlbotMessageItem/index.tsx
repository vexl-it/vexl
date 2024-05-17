import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, Text} from 'tamagui'
import {chatMolecule} from '../../atoms'
import TradeChecklistAmountView from './components/TradeChecklistAmountView'
import TradeChecklistDateAndTimeView from './components/TradeChecklistDateAndTimeView'
import TradeChecklistMeetingLocationView from './components/TradeChecklistMeetingLocationView'
import TradeChecklistNetworkView from './components/TradeChecklistNetworkView'
import TradeChecklistReminder from './components/TradeChecklistReminder'
import {type VexlBotMessageData} from './domain'

export default function VexlbotMessageItem({
  data,
}: {
  data: VexlBotMessageData
}): JSX.Element | null {
  const {otherSideSupportsTradingChecklistAtom} = useMolecule(chatMolecule)
  const otherSideSupportsTradingChecklist = useAtomValue(
    otherSideSupportsTradingChecklistAtom
  )

  if (!otherSideSupportsTradingChecklist) return null
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

  return (
    <Stack>
      <Text color="$greyOnBlack">{JSON.stringify(data, null, 2)}</Text>
    </Stack>
  )
}
