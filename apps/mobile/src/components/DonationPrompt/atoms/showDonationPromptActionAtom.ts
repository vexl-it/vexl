import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {apiAtom} from '../../../api'
import {myDonationsAtom} from '../../../state/donations/atom'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {navigationRef} from '../../../utils/navigation'
import {lastDisplayOfDonationPromptTimestampAtom} from '../../../utils/preferences'
import {showErrorAlertE} from '../../../utils/showErrorAlert'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import DonationAmount from '../components/DonationAmount'
import DonationQrCodeOrStatus from '../components/DonationQrCodeOrStatus'
import {paymentMethodAndAmountConfirmButtonDisabledAtom} from './index'
import {
  donationAmountAtom,
  donationPaymentMethodAtom,
  selectedPredefinedDonationValueAtom,
} from './stateAtoms'

const showDonationPromptActionAtom = atom(null, (get, set) => {
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

export default showDonationPromptActionAtom
