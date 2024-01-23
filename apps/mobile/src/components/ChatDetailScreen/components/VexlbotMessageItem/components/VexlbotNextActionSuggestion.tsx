import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {amountSettled} from '../../../../../state/tradeChecklist/utils/amount'
import {contactRevealed} from '../../../../../state/tradeChecklist/utils/contact'
import {dateAndTimeSettled} from '../../../../../state/tradeChecklist/utils/dateAndTime'
import {locationSettled} from '../../../../../state/tradeChecklist/utils/location'
import {networkSettled} from '../../../../../state/tradeChecklist/utils/network'
import {chatMolecule} from '../../../atoms'
import TradeChecklistAllSetView from './TradeChecklistAllSetView'
import TradeChecklistAmountSuggestionView from './TradeChecklistAmountSuggestionView'
import TradeChecklistDateAndTimeSuggestionView from './TradeChecklistDateAndTimeSuggestionView'
import TradeChecklistMeetingLocationSuggestionView from './TradeChecklistMeetingLocationSuggestionView'
import TradeChecklistNetworkSuggestionView from './TradeChecklistNetworkSuggestionView'

function VexlbotNextActionSuggestion(): JSX.Element | null {
  const {
    tradeChecklistDateAndTimeAtom,
    tradeChecklistMeetingLocationAtom,
    tradeChecklistAmountAtom,
    tradeChecklistNetworkAtom,
    tradeChecklistContactRevealAtom,
  } = useMolecule(chatMolecule)
  const agreedOnDateAndTime = dateAndTimeSettled(
    useAtomValue(tradeChecklistDateAndTimeAtom)
  )
  const agreedOnLocation = locationSettled(
    useAtomValue(tradeChecklistMeetingLocationAtom)
  )
  const agreedOnAmount = amountSettled(useAtomValue(tradeChecklistAmountAtom))
  const agreedOnNetwork = networkSettled(
    useAtomValue(tradeChecklistNetworkAtom)
  )
  const agreedOnContactReveal = contactRevealed(
    useAtomValue(tradeChecklistContactRevealAtom)
  )

  if (
    agreedOnDateAndTime &&
    agreedOnLocation &&
    agreedOnAmount &&
    agreedOnNetwork &&
    agreedOnContactReveal
  )
    return <TradeChecklistAllSetView />

  if (agreedOnAmount && !agreedOnNetwork)
    return <TradeChecklistNetworkSuggestionView />

  if (agreedOnLocation && !agreedOnAmount)
    return <TradeChecklistAmountSuggestionView />

  if (agreedOnDateAndTime && !agreedOnLocation)
    return <TradeChecklistMeetingLocationSuggestionView />

  if (agreedOnLocation || agreedOnAmount || agreedOnNetwork)
    return <TradeChecklistDateAndTimeSuggestionView />

  return null
}

export default VexlbotNextActionSuggestion
