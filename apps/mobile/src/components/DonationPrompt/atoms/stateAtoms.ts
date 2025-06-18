import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {lastDisplayOfDonationPromptTimestampAtom} from '../../../utils/preferences'

export const MAX_DONATION_AMOUNT = 1000 // Maximum donation amount in EUR
export const DONATION_PROMPT_DAYS_THRESHOLD_COUNT = 2

export const donationAmountAtom = atom<string | undefined>(undefined)
export const donationPaymentMethodAtom = atom<'BTC-CHAIN' | 'BTC-LN'>('BTC-LN')

export const shouldShowDonationPromptAtom = atom((get) => {
  const lastDisplayOfDonationPromptTimestamp = get(
    lastDisplayOfDonationPromptTimestampAtom
  )

  return (
    !lastDisplayOfDonationPromptTimestamp ||
    DateTime.now().diff(
      DateTime.fromMillis(lastDisplayOfDonationPromptTimestamp),
      'days'
    ).days > DONATION_PROMPT_DAYS_THRESHOLD_COUNT
  )
})
