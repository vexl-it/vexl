import {Effect} from 'effect'
import {atom} from 'jotai'
import {type MyDonation} from '../../state/donations/domain'
import {translationAtom} from '../../utils/localization/I18nProvider'
import openUrl from '../../utils/openUrl'
import {createDonationInvoiceWithUiFeedbackActionAtom} from '../DonationPrompt/atoms'
import {askAreYouSureActionAtom} from '../GlobalDialog'

export const showClaimConfirmationDialogActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return Effect.gen(function* (_) {
    yield* _(
      set(askAreYouSureActionAtom, {
        variant: 'info',
        steps: [
          {
            type: 'StepWithText',
            title: t('donationConfirmation.importantNotice'),
            description: t(
              'donationConfirmation.toGenerateTheDonationConfirmation'
            ),
            positiveButtonText: t('common.continue'),
            negativeButtonText: t('common.cancel'),
          },
        ],
      })
    )

    const emailBody = encodeURIComponent(
      `${t('donationConfirmation.IWouldLikeToRequestAConfirmation')}\n\n
${t('donationConfirmation.name')} (Name):\n\n
${t('donationConfirmation.address')} (Address):\n\n
${t('donationConfirmation.amount')} (Amount):\n\n
${t('donationConfirmation.invoiceId')} (Invoice ID):\n\n`
    )

    openUrl(
      `mailto:${t('common.marketingEmailAddress')}?subject=Donation confirmation&body=${emailBody}`,
      t('common.marketingEmailAddress')
    )()
  }).pipe(Effect.ignore)
})

export const retryDonationActionAtom = atom(
  null,
  (get, set, donation: MyDonation) =>
    set(createDonationInvoiceWithUiFeedbackActionAtom, {
      amount: Number(donation.fiatAmount),
      paymentMethod: donation.paymentMethod,
    })
)
