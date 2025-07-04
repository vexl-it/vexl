import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {apiAtom} from '../../../api'
import {myDonationsAtom} from '../../../state/donations/atom'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {lastDisplayOfDonationPromptTimestampAtom} from '../../../utils/preferences'
import {showErrorAlertE} from '../../../utils/showErrorAlert'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import DonationAmount from '../components/DonationAmount'
import DonationPrompt from '../components/DonationPrompt'
import DonationQrCode from '../components/DonationQrCode'
import {
  donationAmountAtom,
  donationPaymentMethodAtom,
  MAX_DONATION_AMOUNT,
  shouldShowDonationPromptAtom,
} from './stateAtoms'

const paymentMethodAndAmountConfirmButtonDisabledAtom = atom<boolean>(
  (get) =>
    !get(donationAmountAtom) ||
    Number(get(donationAmountAtom)) === 0 ||
    Number(get(donationAmountAtom)) > MAX_DONATION_AMOUNT
)

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

    set(loadingOverlayDisplayedAtom, true)

    const resp = yield* _(
      api.createInvoice({
        amount: donationAmount ? Number(donationAmount) : 0,
        currency: 'EUR',
        paymentMethod: get(donationPaymentMethodAtom),
      }),
      Effect.tapError((e) => {
        set(loadingOverlayDisplayedAtom, false)
        return Effect.fail(e)
      })
    )

    set(loadingOverlayDisplayedAtom, false)

    yield* _(
      set(askAreYouSureActionAtom, {
        variant: 'info',
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: () =>
              DonationQrCode({
                invoiceId: resp.invoiceId,
                storeId: resp.storeId,
                btcAmount: Schema.decodeSync(Schema.NumberFromString)(
                  resp.btcAmount
                ),
                fiatAmount: Schema.decodeSync(Schema.NumberFromString)(
                  resp.fiatAmount
                ),
                currency: resp.currency,
                paymentLink: resp.paymentLink,
                exchangeRate: Schema.decodeSync(Schema.NumberFromString)(
                  resp.exchangeRate
                ),
              }),
            positiveButtonText: t('common.close'),
          },
        ],
      })
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
      Schema.decodeSync(UnixMillisecondsE)(DateTime.now().toMillis())
    )
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
