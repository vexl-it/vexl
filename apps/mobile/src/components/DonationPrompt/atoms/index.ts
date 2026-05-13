import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  InvoiceId,
  InvoiceStatus,
  PaymentLink,
  statusTypeToStatusMap,
  StoreId,
  type InvoicePaymentMethod,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Effect, pipe, Schema} from 'effect'
import {atom, type WritableAtom} from 'jotai'
import {DateTime} from 'luxon'
import {apiAtom} from '../../../api'
import {
  myDonationsAtom,
  singleDonationAtom,
} from '../../../state/donations/atom'
import {type MyDonation} from '../../../state/donations/domain'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {lastDisplayOfDonationPromptTimestampAtom} from '../../../utils/preferences'
import {globalDialogAtom} from '../../GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import {
  donationAmountAtom,
  donationPaymentMethodAtom,
  MAX_DONATION_AMOUNT,
  selectedPredefinedDonationValueAtom,
} from './stateAtoms'

export const dummyDonation: MyDonation = {
  invoiceId: Schema.decodeSync(InvoiceId)('dummy-invoice-id'),
  storeId: Schema.decodeSync(StoreId)('dummy-store-id'),
  status: Schema.decodeSync(InvoiceStatus)('New'),
  paymentMethod: 'BTC-LN',
  exchangeRate: '1',
  paymentLink: Schema.decodeSync(PaymentLink)('https://dummy-payment-link.com'),
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
    const amount = donationAmount
      ? Number(donationAmount)
      : selectedPredefinedDonationValue
        ? Number(selectedPredefinedDonationValue)
        : 0

    return Number.isNaN(amount) || amount <= 0 || amount > MAX_DONATION_AMOUNT
  }
)

export interface CreateDonationInvoiceParams {
  readonly amount: number
  readonly paymentMethod: InvoicePaymentMethod
}

export const createDonationInvoiceRequestActionAtom = atom(
  null,
  (get, set, {amount, paymentMethod}: CreateDonationInvoiceParams) => {
    const api = get(apiAtom).content

    return Effect.gen(function* (_) {
      set(loadingOverlayDisplayedAtom, true)

      const resp = yield* _(
        api.createInvoice({
          amount,
          currency: 'EUR',
          paymentMethod,
        }),
        Effect.ensuring(
          Effect.sync(() => {
            set(loadingOverlayDisplayedAtom, false)
          })
        )
      )

      set(myDonationsAtom, (prev) => [
        ...prev,
        {
          invoiceId: resp.invoiceId,
          storeId: resp.storeId,
          status: resp.status,
          paymentMethod: resp.paymentMethod,
          fiatAmount: resp.fiatAmount,
          btcAmount: resp.btcAmount,
          currency: resp.currency,
          exchangeRate: resp.exchangeRate,
          createdTime: resp.createdTime,
          expirationTime: resp.expirationTime,
          paymentLink: resp.paymentLink,
        },
      ])

      set(
        lastDisplayOfDonationPromptTimestampAtom,
        Schema.decodeSync(UnixMilliseconds)(DateTime.now().toMillis())
      )

      return resp.invoiceId
    })
  }
)

export const createDonationInvoiceWithUiFeedbackActionAtom: WritableAtom<
  null,
  [params: CreateDonationInvoiceParams],
  Effect.Effect<InvoiceId | undefined>
> = atom(null, (get, set, params: CreateDonationInvoiceParams) => {
  const {t} = get(translationAtom)

  return set(createDonationInvoiceRequestActionAtom, params).pipe(
    Effect.catchAll(() =>
      Effect.gen(function* (_) {
        const shouldRetry = yield* _(
          set(globalDialogAtom, {
            title: t('donations.createInvoiceError.title'),
            subtitle: t('donations.createInvoiceError.description'),
            negativeButtonText: t('common.close'),
            positiveButtonText: t('common.tryAgain'),
          })
        )

        if (shouldRetry)
          return yield* _(
            set(createDonationInvoiceWithUiFeedbackActionAtom, params)
          )

        return undefined
      })
    )
  )
})

export const createDonationInvoiceActionAtom: WritableAtom<
  null,
  [],
  Effect.Effect<InvoiceId | undefined>
> = atom(null, (get, set) =>
  set(createDonationInvoiceWithUiFeedbackActionAtom, {
    amount: get(donationAmountAtom)
      ? Number(get(donationAmountAtom))
      : get(selectedPredefinedDonationValueAtom)
        ? Number(get(selectedPredefinedDonationValueAtom))
        : 0,
    paymentMethod: get(donationPaymentMethodAtom),
  })
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
