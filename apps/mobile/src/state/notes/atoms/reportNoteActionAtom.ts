import {type NoteId} from '@vexl-next/domain/src/general/notes'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Either} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {toastNotificationAtom} from '../../../components/ToastNotification/atom'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {notesAtom} from './notesState'

export const reportNoteActionAtom = atom<
  null,
  [{noteId: NoteId}],
  Effect.Effect<void, Effect.Effect.Error<ReturnType<OfferApi['reportNote']>>>
>(null, (get, set, {noteId}) => {
  const api = get(apiAtom)

  return Effect.gen(function* (_) {
    yield* _(api.offer.reportNote({noteId}))

    set(
      notesAtom,
      Array.map((one) =>
        one.noteInfo.noteId === noteId
          ? {...one, flags: {...one.flags, reported: true}}
          : one
      )
    )
  }).pipe(
    Effect.mapError((e) => {
      reportError('error', new Error('Error while reporting note'), {e})
      return e
    })
  )
})

/**
 * Full report flow with UI feedback: confirmation dialog, loading overlay,
 * success toast / error alert. Resolves to true when the note was reported.
 */
export const reportNoteWithPromptActionAtom = atom(
  null,
  (get, set, {noteId}: {noteId: NoteId}): Effect.Effect<boolean> =>
    Effect.gen(function* (_) {
      const {t} = get(translationAtom)

      const confirmed = yield* _(
        set(globalDialogAtom, {
          title: t('notes.report.dialogTitle'),
          subtitle: t('notes.report.dialogDescription'),
          negativeButtonText: t('common.cancel'),
          positiveButtonText: t('notes.report.confirm'),
          positiveButtonVariant: 'destructive',
        })
      )
      if (!confirmed) return false

      set(loadingOverlayDisplayedAtom, true)
      const result = yield* _(
        set(reportNoteActionAtom, {noteId}),
        Effect.either
      )
      set(loadingOverlayDisplayedAtom, false)

      if (Either.isLeft(result)) {
        showErrorAlert({
          title: t('common.somethingWentWrong'),
          error: result.left,
        })
        return false
      }

      set(toastNotificationAtom, {
        title: t('notes.report.toastTitle'),
        description: t('notes.report.toastDescription'),
      })
      return true
    })
)
