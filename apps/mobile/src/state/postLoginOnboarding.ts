import {Effect} from 'effect'
import {atom, useAtomValue} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {showErrorAlert} from '../components/ErrorAlert'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'
import {translationAtom} from '../utils/localization/I18nProvider'
import {showCheckUpdatedPrivacyPolicySuggestionAtom} from '../utils/preferences'
import reportError from '../utils/reportError'
import {upsertInboxOnBeAndLocallyActionAtom} from './chat/hooks/useCreateInbox'
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

  return set(upsertInboxOnBeAndLocallyActionAtom, {
    for: 'userSesssion',
    key: get(sessionDataOrDummyAtom).privateKey,
  }).pipe(
    Effect.match({
      onFailure(e) {
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
