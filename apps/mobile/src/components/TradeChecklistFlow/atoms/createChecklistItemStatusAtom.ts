import {type Atom, atom} from 'jotai'
import {tradeChecklistDataAtom} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import updatesToBeSentAtom from './updatesToBeSentAtom'
import {type TradeChecklistItem} from '../domain'
import {type TradeChecklistItemStatus} from '@vexl-next/domain/src/general/tradeChecklist'
import * as DateAndTime from '../../../state/tradeChecklist/utils/dateAndTime'
import fastDeepEqual from 'fast-deep-equal'

export default function createChecklistItemStatusAtom(
  item: TradeChecklistItem
): Atom<TradeChecklistItemStatus> {
  return atom((get) => {
    const tradeChecklistData = get(tradeChecklistDataAtom)
    const updates = get(updatesToBeSentAtom)

    if (item === 'DATE_AND_TIME') {
      const dateAndTime = tradeChecklistData.dateAndTime
      const picks = DateAndTime.getPick(dateAndTime)

      if (updates.dateAndTime) return 'readyToSend'

      if (picks) return 'pending'

      const suggestions = DateAndTime.getSuggestions(dateAndTime)
      if (suggestions) return 'pending'
      return 'initial'
    }

    if (item === 'CALCULATE_AMOUNT') {
      const amount = tradeChecklistData.amount
      const {timestamp: tsSent = undefined, ...sentDataNoTimestamp} = {
        ...amount.sent,
      }
      const {timestamp: tsReceived = undefined, ...receivedDataNoTimestamp} = {
        ...amount.received,
      }

      if (updates.amount) return 'readyToSend'

      // same values in payload mean accepted state
      if (
        tsSent &&
        tsReceived &&
        fastDeepEqual(sentDataNoTimestamp, receivedDataNoTimestamp)
      )
        return 'accepted'

      // - I was first who suggested the amount
      // - or the other side was first who suggested the amount
      // - or my suggestion is the last one sent
      if (tsSent && !tsReceived) return 'pending'
      if (!tsSent && tsReceived) return 'pending'
      if (tsSent && tsReceived && tsSent > tsReceived) return 'pending'

      // other side sent another suggestion without accepting mine
      if (amount.sent?.btcAmount && amount.received?.btcAmount) return 'warning'

      return 'initial'
    }

    if (item === 'SET_NETWORK') {
      const network = tradeChecklistData.network

      if (updates.network) return 'readyToSend'

      if (network?.sent?.btcNetwork) {
        return 'accepted'
      }

      return 'initial'
    }

    if (item === 'REVEAL_IDENTITY') {
      const identityReveal = tradeChecklistData.identity

      if (updates.identity?.status === 'REQUEST_REVEAL') return 'readyToSend'

      if (
        identityReveal?.received?.status === 'DISAPPROVE_REVEAL' ||
        updates?.identity?.status === 'DISAPPROVE_REVEAL' ||
        identityReveal?.sent?.status === 'DISAPPROVE_REVEAL'
      )
        return 'declined'

      if (
        identityReveal?.received?.status === 'APPROVE_REVEAL' ||
        identityReveal?.sent?.status === 'APPROVE_REVEAL'
      )
        return 'accepted'

      if (
        identityReveal?.sent?.status === 'REQUEST_REVEAL' ||
        identityReveal?.received?.status === 'REQUEST_REVEAL'
      )
        return 'pending'

      if (identityReveal?.received?.status === 'disapproved') return 'warning'
    }

    if (item === 'REVEAL_PHONE_NUMBER') {
      const contactReveal = tradeChecklistData.contact

      if (updates.contact?.status === 'REQUEST_REVEAL') return 'readyToSend'

      if (
        contactReveal?.received?.status === 'DISAPPROVE_REVEAL' ||
        updates?.contact?.status === 'DISAPPROVE_REVEAL' ||
        contactReveal?.sent?.status === 'DISAPPROVE_REVEAL'
      )
        return 'declined'

      if (
        contactReveal?.received?.status === 'APPROVE_REVEAL' ||
        contactReveal?.sent?.status === 'APPROVE_REVEAL'
      )
        return 'accepted'

      if (
        contactReveal?.sent?.status === 'REQUEST_REVEAL' ||
        contactReveal?.received?.status === 'REQUEST_REVEAL'
      )
        return 'pending'

      if (contactReveal?.received?.status === 'disapproved') return 'warning'
    }

    return 'initial'
  })
}
