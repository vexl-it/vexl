import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  type InvoiceId,
  type InvoiceStatus,
  type InvoiceStatusType,
  type PaymentLink,
  type StoreId,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, pipe, Schema} from 'effect'
import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {apiAtom} from '../../../api'
import {
  myDonationsAtom,
  singleDonationAtom,
} from '../../../state/donations/atom'
import {type MyDonation} from '../../../state/donations/domain'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {navigationRef} from '../../../utils/navigation'
import {lastDisplayOfDonationPromptTimestampAtom} from '../../../utils/preferences'
import {showErrorAlertE} from '../../../utils/showErrorAlert'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import DonationAmount from '../components/DonationAmount'
import DonationPrompt from '../components/DonationPrompt'
import DonationQrCodeOrStatus from '../components/DonationQrCodeOrStatus'
import {
  donationAmountAtom,
  donationPaymentMethodAtom,
  MAX_DONATION_AMOUNT,
  selectedPredefinedDonationValueAtom,
  shouldShowDonationPromptAtom,
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
  createdTime: Schema.decodeSync(UnixMillisecondsE)(DateTime.now().toMillis()),
  expirationTime: Schema.decodeSync(UnixMillisecondsE)(
    DateTime.now().toMillis()
  ),
}

const paymentMethodAndAmountConfirmButtonDisabledAtom = atom<boolean>((get) => {
  const donationAmount = get(donationAmountAtom)
  const selectedPredefinedDonationValue = get(
    selectedPredefinedDonationValueAtom
  )

  return (
    (!donationAmount && !selectedPredefinedDonationValue) ||
    Number(donationAmount) === 0 ||
    Number(donationAmount) > MAX_DONATION_AMOUNT
  )
})

export const showDonationPromptActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const api = get(apiAtom).content

  return Effect.gen(function* (_) {
    yield* _(
      set(askAreYouSureActionAtom, {
        variant: 'info',
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: DonationAmount,
            positiveButtonText: t('common.confirm'),
            negativeButtonText: t('common.cancel'),
            positiveButtonDisabledAtom:
              paymentMethodAndAmountConfirmButtonDisabledAtom,
          },
        ],
      })
    )

    const donationAmount = get(donationAmountAtom)
      ? Number(get(donationAmountAtom))
      : get(selectedPredefinedDonationValueAtom)
        ? Number(get(selectedPredefinedDonationValueAtom))
        : 0

    set(loadingOverlayDisplayedAtom, true)

    const resp = yield* _(
      api.createInvoice({
        amount: donationAmount,
        currency: 'EUR',
        paymentMethod: get(donationPaymentMethodAtom),
      }),
      Effect.tapError((e) => {
        set(loadingOverlayDisplayedAtom, false)
        return Effect.fail(e)
      })
    )

    set(loadingOverlayDisplayedAtom, false)

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
      Schema.decodeSync(UnixMillisecondsE)(DateTime.now().toMillis())
    )

    const currentRoute = navigationRef.getCurrentRoute()

    yield* _(
      set(askAreYouSureActionAtom, {
        variant: 'info',
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: () =>
              DonationQrCodeOrStatus({
                invoiceId: resp.invoiceId,
              }),
            negativeButtonText:
              currentRoute?.name === 'MyDonations'
                ? undefined
                : t('common.close'),
            positiveButtonText:
              currentRoute?.name === 'MyDonations'
                ? t('common.close')
                : t('donationPrompt.seeMyDonations'),
          },
        ],
      })
    )

    if (navigationRef.isReady() && currentRoute?.name !== 'MyDonations') {
      navigationRef.navigate('MyDonations')
    }
  }).pipe(
    Effect.catchAll((e) => {
      if (e._tag === 'UserDeclinedError') return Effect.succeed(Effect.void)
      if (e._tag === 'NetworkError') {
        return Effect.zipRight(
          showErrorAlertE({
            title: t('common.NetworkError'),
          }),
          Effect.succeed(Effect.void)
        )
      }

      return Effect.zipRight(
        showErrorAlertE({
          title: t('donationPrompt.errorCreatingInvoice'),
          error: e,
        }),
        Effect.succeed(Effect.void)
      )
    })
  )
})

export const showDonationPromptGiveLoveActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const shouldShowDonationPrompt = get(shouldShowDonationPromptAtom)

  if (!shouldShowDonationPrompt) return Effect.succeed(Effect.void)

  return Effect.gen(function* (_) {
    yield* _(
      set(askAreYouSureActionAtom, {
        variant: 'info',
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: DonationPrompt,
            positiveButtonText: t('donationPrompt.donate'),
            negativeButtonText: t('common.back'),
          },
        ],
      })
    )

    yield* _(set(showDonationPromptActionAtom))
  }).pipe(
    Effect.catchTag('UserDeclinedError', () => {
      set(
        lastDisplayOfDonationPromptTimestampAtom,
        Schema.decodeSync(UnixMillisecondsE)(DateTime.now().toMillis())
      )

      return Effect.succeed(Effect.void)
    })
  )
})

// states of success invoice
// InvoiceCreated -> InvoicePaymentSettled -> InvoiceReceivedPayment ->
// -> InvoiceProcessing -> InvoiceSettled

function convertInvoiceStatusTypeToMyDonationStatus(
  invoiceStatusType: InvoiceStatusType
): InvoiceStatus {
  switch (invoiceStatusType) {
    case 'InvoiceCreated':
      return 'New'
    case 'InvoicePaymentSettled':
    case 'InvoiceReceivedPayment':
    case 'InvoiceProcessing':
      return 'Processing'
    case 'InvoiceSettled':
      return 'Settled'
    case 'InvoiceExpired':
      return 'Expired'
    default:
      return 'Invalid'
  }
}

const DONATION_STATUSES_TO_UPDATE: InvoiceStatus[] = [
  'New',
  'Processing',
  'Confirmed',
]

export const updateSingleInvoiceStatusTypeActionAtom = atom(
  null,
  (get, set, {invoiceId}: {invoiceId: InvoiceId}) => {
    const api = get(apiAtom).content

    return Effect.gen(function* (_) {
      const mySingleDonation = singleDonationAtom(invoiceId)
      const status = get(mySingleDonation)?.status

      if (status && !DONATION_STATUSES_TO_UPDATE.includes(status))
        return Effect.void

      const {statusType} = yield* _(api.getInvoiceStatusType({invoiceId}))

      const myDonationReceivecStatus =
        convertInvoiceStatusTypeToMyDonationStatus(statusType)

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
  (get, set, {invoiceId}: {invoiceId: InvoiceId}) =>
    pipe(
      set(updateSingleInvoiceStatusTypeActionAtom, {invoiceId}),
      Effect.delay('1 second'),
      Effect.forever,
      Effect.withSpan('BTC pay server invoice status repeating query')
    )
)

export const updateAllNonSettledOrExpiredInvoicesStatusTypesActionAtom = atom(
  null,
  (get, set) =>
    Effect.gen(function* (_) {
      const api = get(apiAtom).content
      const myDonations = get(myDonationsAtom)

      const invoiceIdsToFetch = myDonations
        .filter((donation) =>
          DONATION_STATUSES_TO_UPDATE.includes(donation.status)
        )
        .map((donation) => donation.invoiceId)

      if (invoiceIdsToFetch.length === 0) return Effect.succeed(Effect.void)

      const fetchedStatuses = yield* _(
        Effect.forEach(invoiceIdsToFetch, (invoiceId) =>
          api.getInvoiceStatusType({invoiceId})
        ),
        Effect.map((statuses) =>
          statuses.map(({invoiceId, statusType}) => ({
            invoiceId,
            status: convertInvoiceStatusTypeToMyDonationStatus(statusType),
          }))
        )
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
