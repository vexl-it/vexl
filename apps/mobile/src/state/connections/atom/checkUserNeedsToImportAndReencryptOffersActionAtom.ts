import {Effect} from 'effect/index'
import {atom} from 'jotai'
import {askAreYouSureActionAtom} from '../../../components/GlobalDialog'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {effectWithEnsuredBenchmark} from '../../ActionBenchmarks'
import {submitContactsActionAtom} from '../../contacts/atom/submitContactsActionAtom'
import {unexpectedReachDropDetectedAtom} from './connectionStateAtom'

const showUnexpectedReachDropDialogActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const {t} = get(translationAtom)
    yield* _(
      Effect.sync(() => {
        reportError('warn', new Error('Unexpected reach drop dialog shown'))
      })
    )

    const shouldReimportContacts = yield* _(
      set(askAreYouSureActionAtom, {
        steps: [
          {
            type: 'StepWithText',
            title: t('unexpectedReachDrop.title'),
            description: t('unexpectedReachDrop.reimportDescription'),
            negativeButtonText: t('common.cancel'),
            positiveButtonText: t('unexpectedReachDrop.reimportActionTitle'),
          },
        ],
        variant: 'danger',
      }).pipe(
        Effect.as(true),
        Effect.catchAll(() => Effect.succeed(false))
      )
    )

    if (!shouldReimportContacts) return

    yield* _(
      set(submitContactsActionAtom, {
        normalizeAndImportAll: true,
        showOfferReencryptionDialog: true,
      })
    )
  })
})

/**
 * Prompts the user to re-import contacts after a connections fetch was rejected
 * with UnexpectedReachDropError. This does not take clubs into consideration.
 */
export const checkUserNeedsToImportContactsAndReencryptOffersActionAtom = atom(
  null,
  (get, set) => {
    return Effect.gen(function* (_) {
      if (!get(unexpectedReachDropDetectedAtom)) return

      set(unexpectedReachDropDetectedAtom, false)
      yield* _(set(showUnexpectedReachDropDialogActionAtom))
    }).pipe(
      effectWithEnsuredBenchmark(
        'check if user needs to import contacts and reencrypt offers'
      )
    )
  }
)
