import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
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

function VexlbotNextActionSuggestion(): React.ReactElement | null {
  const {
    offerForChatAtom,
    tradeChecklistDateAndTimeAtom,
    tradeChecklistMeetingLocationAtom,
    tradeChecklistAmountAtom,
    tradeChecklistNetworkAtom,
    tradeChecklistContactRevealAtom,
    shouldHideNetworkCellForTradeChecklistAtom,
    identityRevealStatusAtom,
    contactRevealStatusAtom,
  } = useMolecule(chatMolecule)
  const offerForChat = useAtomValue(offerForChatAtom)
  const shouldHideNetworkCellForTradeChecklist = useAtomValue(
    shouldHideNetworkCellForTradeChecklistAtom
  )
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
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)

  if (offerForChat?.offerInfo.publicPart.locationState.includes('ONLINE'))
    return null

  if (identityRevealStatus === 'iAsked' || identityRevealStatus === 'theyAsked')
    return null
  if (contactRevealStatus === 'iAsked' || contactRevealStatus === 'theyAsked')
    return null

  if (
    agreedOnDateAndTime &&
    agreedOnLocation &&
    agreedOnAmount &&
    agreedOnNetwork &&
    agreedOnContactReveal
  )
    return <TradeChecklistAllSetView />

  if (
    agreedOnAmount &&
    !agreedOnNetwork &&
    !shouldHideNetworkCellForTradeChecklist
  )
    return <TradeChecklistNetworkSuggestionView />

  if (agreedOnLocation && !agreedOnAmount)
    return <TradeChecklistAmountSuggestionView />

  if (agreedOnDateAndTime && !agreedOnLocation)
    return <TradeChecklistMeetingLocationSuggestionView />

  if (
    !agreedOnDateAndTime &&
    (agreedOnLocation || agreedOnAmount || agreedOnNetwork)
  )
    return <TradeChecklistDateAndTimeSuggestionView />

  return null
}

export default VexlbotNextActionSuggestion
