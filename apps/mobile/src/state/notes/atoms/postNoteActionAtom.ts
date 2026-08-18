import {type NavigationProp} from '@react-navigation/native'
import {Effect, Either} from 'effect'
import {atom} from 'jotai'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {offerProgressModalActionAtoms} from '../../../components/UploadingOfferProgressModal/atoms'
import {type RootStackParamsList} from '../../../navigationTypes'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import navigateToBoard from '../../../utils/navigateToBoard'
import {createNoteActionAtom} from './createNoteActionAtom'

const SUCCESS_DIALOG_DURATION_MS = 2000

/**
 * Full note posting flow with UI feedback: keyboard dismiss, progress modal
 * with encryption steps, deferred success dialog and navigation to the board.
 * Resolves to true when the note was posted.
 */
export const postNoteActionAtom = atom(
  null,
  (
    get,
    set,
    {
      text,
      allowRepost,
      expiresAfterDays,
      navigation,
      allowNextRemove,
    }: {
      text: string
      allowRepost: boolean
      expiresAfterDays: number
      navigation: NavigationProp<RootStackParamsList>
      allowNextRemove: () => void
    }
  ): Effect.Effect<boolean> => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      yield* _(Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate))

      set(offerProgressModalActionAtoms.show, {
        title: t('notes.create.encryptingYourNote'),
        bottomText: t('offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'),
        indicateProgress: {type: 'intermediate'},
      })

      const result = yield* _(
        set(createNoteActionAtom, {
          text,
          allowRepost,
          expiresAfterDays,
          onProgress: (progress) => {
            set(offerProgressModalActionAtoms.showStep, {
              progress,
              textData: {
                title: t('notes.create.encryptingYourNote'),
                bottomText: t(
                  'offerForm.offerEncryption.dontCloseTheAppCanTakeAWhile'
                ),
              },
            })
          },
        }),
        Effect.either
      )

      if (Either.isLeft(result)) {
        set(offerProgressModalActionAtoms.hide)
        showErrorAlert({
          title: t('common.somethingWentWrong'),
          error: result.left,
        })
        return false
      }

      Effect.runFork(
        set(offerProgressModalActionAtoms.hideDeffered, {
          data: {
            title: t('notes.create.postedToastTitle'),
            bottomText: t('notes.create.postedToastDescription'),
            indicateProgress: {type: 'hidden'},
          },
          delayMs: SUCCESS_DIALOG_DURATION_MS,
        })
      )
      allowNextRemove()
      navigateToBoard(navigation, 'mine')
      return true
    }).pipe(
      Effect.catchAllDefect((defect) => {
        set(offerProgressModalActionAtoms.hide)
        showErrorAlert({
          title: t('common.somethingWentWrong'),
          error: defect,
        })
        return Effect.succeed(false)
      })
    )
  }
)
