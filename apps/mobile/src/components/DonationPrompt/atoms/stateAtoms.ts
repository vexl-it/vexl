import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {lastDisplayOfDonationPromptTimestampAtom} from '../../../utils/preferences'

export const PREDEFINED_DONATION_AMOUNTS = [10, 20, 30, 50]
export const MAX_DONATION_AMOUNT = 1000 // Maximum donation amount in EUR
export const DONATION_PROMPT_DAYS_THRESHOLD_COUNT = 2

export type DonationPaymentMethod = 'BTC-CHAIN' | 'BTC-LN'

export const donationAmountAtom = atom<string | undefined>(undefined)
export const selectedPredefinedDonationValueAtom = atom<number | undefined>(
  undefined
)
export const donationPaymentMethodAtom = atom<DonationPaymentMethod>('BTC-LN')

export const resetDonationPromptValuesActionAtom = atom(null, (get, set) => {
  set(donationAmountAtom, undefined)
  set(selectedPredefinedDonationValueAtom, undefined)
  set(donationPaymentMethodAtom, 'BTC-LN')
})

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
