import {taskEitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'
import {translationAtom} from '../utils/localization/I18nProvider'
import {showCheckUpdatedPrivacyPolicySuggestionAtom} from '../utils/preferences'
import reportError from '../utils/reportError'
import showErrorAlert from '../utils/showErrorAlert'
import {createInboxAtom} from './chat/hooks/useCreateInbox'
import {sessionDataOrDummyAtom} from './session'

export const postLoginFinishedStorageAtom = atomWithParsedMmkvStorage(
  'postLoginFinished1',
  {postLoginFinished: false},
  z.object({postLoginFinished: z.boolean()}).readonly()
)
export const postLoginFinishedAtom = focusAtom(
  postLoginFinishedStorageAtom,
  (o) => o.prop('postLoginFinished')
)

export const finishPostLoginFlowActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return pipe(
    set(createInboxAtom, {
      inbox: {privateKey: get(sessionDataOrDummyAtom).privateKey},
    }),
    taskEitherToEffect,
    Effect.match({
      onFailure(e) {
        if (e._tag === 'ErrorInboxAlreadyExists') {
          set(postLoginFinishedAtom, true)
          return
        }
        reportError('error', new Error('Error creating inbox'), {e})
        showErrorAlert({
          title: t('common.errorCreatingInbox'),
          error: e,
        })
      },
      onSuccess() {
        set(showCheckUpdatedPrivacyPolicySuggestionAtom, false)
        set(postLoginFinishedAtom, true)
      },
    })
  )
})

export function useIsPostLoginFinished(): boolean {
  return useAtomValue(postLoginFinishedAtom)
}
