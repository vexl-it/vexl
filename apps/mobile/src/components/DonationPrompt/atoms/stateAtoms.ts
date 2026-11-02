import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type InvoiceStatus} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {type MyDonation} from '../../../state/donations/domain'

export const PREDEFINED_DONATION_AMOUNTS = [10, 20, 30, 50]
export const MAX_DONATION_AMOUNT = 1000 // Maximum donation amount in EUR
export const DONATION_PROMPT_DAYS_THRESHOLD_COUNT = 2
const RECENT_DONATION_DAYS = 30
const PAID_OR_PROCESSING_STATUSES: InvoiceStatus[] = [
  'Processing',
  'Paid',
  'Confirmed',
  'Complete',
  'Settled',
]

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

export function donationPromptCooldownPassed(
  lastDisplayTimestamp: UnixMilliseconds | undefined
): boolean {
  return (
    !lastDisplayTimestamp ||
    DateTime.now().diff(DateTime.fromMillis(lastDisplayTimestamp), 'days')
      .days > DONATION_PROMPT_DAYS_THRESHOLD_COUNT
  )
}

export function hasRecentDonation(donations: readonly MyDonation[]): boolean {
  const cutoff = DateTime.now().minus({days: RECENT_DONATION_DAYS}).toMillis()

  return pipe(
    donations,
    Array.some(
      (donation) =>
        donation.createdTime > cutoff &&
        PAID_OR_PROCESSING_STATUSES.includes(donation.status)
    )
  )
}
