import {InvoiceStatus} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Schema, pipe} from 'effect'
import {MyDonation} from '../../../../state/donations/domain'
import {donationStatusTranslationKey} from '../../utils'
import {
  filterDonationsByStatus,
  type DonationStatusFilter,
} from './donationStatusFilter'

const donations = pipe(
  InvoiceStatus.literals,
  Array.map((status, index) =>
    Schema.decodeUnknownSync(MyDonation)({
      invoiceId: `invoice-${index}`,
      storeId: 'store',
      paymentMethod: 'BTC-LN',
      status,
      exchangeRate: '75000',
      paymentLink: 'lightning:invoice',
      fiatAmount: '10',
      btcAmount: '0.00013333',
      currency: 'EUR',
      createdTime: 1_790_000_000_000 - index,
      expirationTime: 1_790_000_900_000,
    })
  )
)

it('shows all donations in their original order by default', () => {
  expect(filterDonationsByStatus(donations, 'all')).toBe(donations)
})

it.each([
  {filter: 'inProgress', statuses: ['New', 'Processing']},
  {filter: 'paid', statuses: ['Paid', 'Complete', 'Confirmed', 'Settled']},
  {filter: 'unsuccessful', statuses: ['Expired', 'Invalid']},
] satisfies ReadonlyArray<{
  filter: DonationStatusFilter
  statuses: readonly InvoiceStatus[]
}>)(
  'groups $filter donations and preserves their order',
  ({filter, statuses}) => {
    const result = filterDonationsByStatus(donations, filter)
    expect(
      pipe(
        result,
        Array.map((donation) => donation.status)
      )
    ).toEqual(statuses)
  }
)

it('preserves every donation exactly once across the three status groups', () => {
  const grouped = pipe(
    ['inProgress', 'paid', 'unsuccessful'] satisfies DonationStatusFilter[],
    Array.flatMap((filter) => filterDonationsByStatus(donations, filter))
  )
  expect(grouped).toHaveLength(donations.length)
  expect(grouped).toEqual(expect.arrayContaining(donations))
})

it('does not change the source when filtering', () => {
  const snapshot = [...donations]
  filterDonationsByStatus(donations, 'inProgress')
  filterDonationsByStatus(donations, 'paid')
  filterDonationsByStatus(donations, 'unsuccessful')
  expect(donations).toEqual(snapshot)
})

it('moves donations between groups as their status changes', () => {
  const selected = Schema.decodeUnknownSync(MyDonation)({
    ...donations[0],
    status: 'New',
  })
  expect(filterDonationsByStatus([selected], 'inProgress')).toEqual([selected])
  const settled: MyDonation = {...selected, status: 'Settled'}
  expect(filterDonationsByStatus([settled], 'inProgress')).toEqual([])
  expect(filterDonationsByStatus([settled], 'paid')).toEqual([settled])
  const expired: MyDonation = {...selected, status: 'Expired'}
  expect(filterDonationsByStatus([expired], 'unsuccessful')).toEqual([expired])
})

it('returns an empty list for missing groups and deleted donations', () => {
  const paid = filterDonationsByStatus(donations, 'paid')
  expect(filterDonationsByStatus(paid, 'inProgress')).toEqual([])
  expect(filterDonationsByStatus([], 'all')).toEqual([])
  expect(filterDonationsByStatus([], 'paid')).toEqual([])
})

it('uses Created for New donations and retains the other status labels', () => {
  expect(donationStatusTranslationKey('New')).toBe(
    'donations.invoiceStatus.Created'
  )
  expect(donationStatusTranslationKey('Processing')).toBe(
    'donations.invoiceStatus.Processing'
  )
  expect(donationStatusTranslationKey('Settled')).toBe(
    'donations.invoiceStatus.Settled'
  )
})
