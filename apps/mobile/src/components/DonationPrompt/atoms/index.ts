import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  statusTypeToStatusMap,
  type InvoiceId,
  type InvoiceStatus,
  type PaymentLink,
  type StoreId,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Effect, pipe, Schema} from 'effect'
import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {apiAtom} from '../../../api'
import {
  myDonationsAtom,
  singleDonationAtom,
} from '../../../state/donations/atom'
import {type MyDonation} from '../../../state/donations/domain'
import {
  donationAmountAtom,
  MAX_DONATION_AMOUNT,
  selectedPredefinedDonationValueAtom,
} from './stateAtoms'

export const dummyDonation: MyDonation = {
  invoiceId: 'dummy-invoice-id' as InvoiceId,
  storeId: 'dummy-store-id' as StoreId,
  status: 'New' as InvoiceStatus,
  paymentMethod: 'BTC-LN',
  exchangeRate: '1',
  paymentLink: 'https://dummy-payment-link.com' as PaymentLink,
  fiatAmount: '0',
  btcAmount: '0',
  currency: 'EUR',
  createdTime: Schema.decodeSync(UnixMilliseconds)(DateTime.now().toMillis()),
  expirationTime: Schema.decodeSync(UnixMilliseconds)(
    DateTime.now().toMillis()
  ),
}

export const paymentMethodAndAmountConfirmButtonDisabledAtom = atom<boolean>(
  (get) => {
    const donationAmount = get(donationAmountAtom)
    const selectedPredefinedDonationValue = get(
      selectedPredefinedDonationValueAtom
    )

    return (
      (!donationAmount && !selectedPredefinedDonationValue) ||
      Number(donationAmount) === 0 ||
      Number(donationAmount) > MAX_DONATION_AMOUNT
    )
  }
)

const DONATION_STATUSES_TO_UPDATE: InvoiceStatus[] = [
  'New',
  'Processing',
  'Confirmed',
]

export const updateSingleInvoiceStatusTypeActionAtom = atom(
  null,
  (
    get,
    set,
    {invoiceId, storeId}: {invoiceId: InvoiceId; storeId: StoreId}
  ) => {
    const api = get(apiAtom).content

    return Effect.gen(function* (_) {
      const mySingleDonation = singleDonationAtom(invoiceId)
      const status = get(mySingleDonation)?.status

      if (status && !DONATION_STATUSES_TO_UPDATE.includes(status))
        return Effect.void

      const {statusType} = yield* _(
        api.getInvoiceStatusType({
          invoiceId,
          storeId,
        })
      )

      const myDonationReceivecStatus = statusTypeToStatusMap[statusType]

      if (get(mySingleDonation)?.status !== myDonationReceivecStatus)
        set(mySingleDonation, (prev) => ({
          ...prev,
          status: myDonationReceivecStatus,
        }))
    })
  }
)

export const updateSingleInvoiceStatusTypeRepeatingActionAtom = atom(
  null,
  (get, set, {invoiceId, storeId}: {invoiceId: InvoiceId; storeId: StoreId}) =>
    pipe(
      set(updateSingleInvoiceStatusTypeActionAtom, {invoiceId, storeId}),
      Effect.delay('1 second'),
      Effect.forever,
      Effect.withSpan('BTC pay server invoice status repeating query')
    )
)

export const updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom = atom(
  null,
  (get, set) =>
    Effect.gen(function* (_) {
      const api = get(apiAtom)
      const myDonations = get(myDonationsAtom)

      const invoicesToFetch = myDonations
        .filter((donation) =>
          DONATION_STATUSES_TO_UPDATE.includes(donation.status)
        )
        .map((donation) => ({
          invoiceId: donation.invoiceId,
          storeId: donation.storeId,
        }))

      if (invoicesToFetch.length === 0) return Effect.succeed(Effect.void)

      const fetchedStatuses = yield* _(
        invoicesToFetch,
        Array.map(({invoiceId, storeId}) =>
          api.content.getInvoiceStatusType({invoiceId, storeId})
        ),
        Effect.all,
        Effect.map((statuses) => {
          return statuses.map(({invoiceId, statusType}) => ({
            invoiceId,
            status: statusTypeToStatusMap[statusType],
          }))
        })
      )

      set(myDonationsAtom, (prev) =>
        prev.map((donation) => {
          const updatedStatus = fetchedStatuses.find(
            (status) => status.invoiceId === donation.invoiceId
          )
          return updatedStatus
            ? {...donation, status: updatedStatus.status}
            : donation
        })
      )
    })
)
