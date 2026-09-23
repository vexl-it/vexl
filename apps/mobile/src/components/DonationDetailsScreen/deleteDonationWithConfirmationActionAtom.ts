import {type InvoiceId} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {setMyDonationsAndSaveImmediatelyActionAtom} from '../../state/donations/atom'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {globalDialogAtom} from '../GlobalDialog'

export const deleteDonationWithConfirmationActionAtom = atom(
  null,
  (get, set, invoiceId: InvoiceId) =>
    Effect.gen(function* () {
      const {t} = get(translationAtom)
      const confirmed = yield* set(globalDialogAtom, {
        title: t('donations.detail.deleteDonation'),
        subtitle: t('donations.detail.deleteDonationDescription'),
        positiveButtonText: t('common.yesDelete'),
        positiveButtonVariant: 'destructive',
        negativeButtonText: t('common.cancel'),
      })

      if (!confirmed) return false

      set(setMyDonationsAndSaveImmediatelyActionAtom, (previous) => ({
        ...previous,
        data: pipe(
          previous.data,
          Array.filter((donation) => donation.invoiceId !== invoiceId)
        ),
      }))

      return true
    })
)
