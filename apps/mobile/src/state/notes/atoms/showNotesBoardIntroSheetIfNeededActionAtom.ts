import {Effect} from 'effect'
import {atom} from 'jotai'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {
  notesBoardEnabledAtom,
  showNotesBoardIntroSheetAtom,
} from '../../../utils/preferences'

export const showNotesBoardIntroSheetIfNeededActionAtom = atom(
  null,
  (get, set) => {
    if (!get(notesBoardEnabledAtom)) {
      return Effect.succeed(false)
    }

    if (!get(showNotesBoardIntroSheetAtom)) {
      return Effect.succeed(false)
    }

    const {t} = get(translationAtom)

    set(showNotesBoardIntroSheetAtom, false)

    return Effect.gen(function* (_) {
      yield* _(
        set(globalDialogAtom, {
          title: t('notes.board.introTitle'),
          subtitle: t('notes.board.introDescription'),
          positiveButtonText: t('common.gotIt'),
        }),
        Effect.ignore
      )

      return true
    })
  }
)
